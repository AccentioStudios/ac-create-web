const packageJson = require('./package.json');
const commander = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const semver = require('semver');
const validateProjectName = require('validate-npm-package-name');
const fetch = require('node-fetch');
const execSync = require('child_process').execSync;
const simpleGit = require('simple-git');
const { option } = require('commander');

let projectName;
let options = [];
const npmUrl = 'https://registry.npmjs.org/-/package/ac-create-web/dist-tags'
const repoBoilerplate = 'https://github.com/AccentioStudios/accentio-web.git';

function init() {
    console.log('Bienvenido a AC-Create.');
    console.log();
    // Init
    const program = new commander.Command(packageJson.name)
    .version(packageJson.version);
    // Argument
    program
    .arguments('<app-name>')
    .description('nombre del proyecto', {
        'app-name': 'Nombre del directorio y nombre de la aplicacion a crear'
    })
    .action(_projectName => {
        projectName = _projectName;
        console.log('El nombre de tu aplicacion va a ser:');
        console.log(`       ${chalk.cyan(projectName)}`);
    });
    // Options
    program
    .option('-t, --test', 'testing option')
    .option('-f, --force', 'forzar creacion del proyecto')
    .option('-i, --install', 'instalar paquetes npm al final')
    .allowUnknownOption()
    .parse(process.argv);
    options = program.opts();
    console.log();
    checkForLatestVersion()
        .then(checkForLatestVersionThen)
        .then(() => {
            createApp(projectName);
        })
        .catch((onError) => {
            console.error(
                chalk.red(
                    `Ocurrio un error al intentar verificar la version actual del paquete.\n` +
                    `${onError}`
                )
            )
            process.exit(1);
        })
}

function createApp(projectName) {
    if(typeof projectName === 'undefined') {
        console.error('Por favor especifica el nombre del proyecto:');
        console.log(
            `  ${chalk.cyan(program.name())} ${chalk.green('<app-name>')}`
        );
        process.exit(1);
    }

    if (options.test) {
        console.log(`Ay el mio tamos creando un proyecto`);
        console.log(`       ${chalk.green(projectName)}`);
    }

    // Paths
    const rootApp = path.resolve(projectName);
    const appName = path.basename(rootApp);
    const originalDirectory = process.cwd();

    checkAppName(appName);
    // create dir
    if (fs.pathExistsSync(rootApp)){
        console.error(`${chalk.red(`El directorio para la creacion del proyecto ya existe`)}`);
        console.error(`     ${chalk.green(rootApp)}`);
        if(!options.force) {
            console.error(`${chalk.red(`No se puede continaur con la creacion del proyecto.`)}`);
            process.exit(1);
        } else {
            console.log();
            console.error(`${chalk.yellow(`Eliminando carpeta y sus contenidos...`)}`);
            console.log();
            fs.removeSync(rootApp);
        }
    }
    console.log('Creando directorio del proyecto...');
    fs.ensureDirSync(projectName);
    console.log(`     ${chalk.green(rootApp)}`);
    console.log();

    // const packageJson = {
    //     name: projectName,
    //     version: '0.1.0'
    // };
    // fs.writeFileSync(
    //     path.join(rootApp, 'package.json'),
    //     JSON.stringify(packageJson, null, 2) + os.EOL
    // );
    run(rootApp, projectName, originalDirectory);
}

async function run(rootApp, projectName, originalDirectory) {
    // Enter to dir from App
    process.chdir(rootApp);
    try {
        await getForGitInstallation();
        await getBoilerplate(rootApp, projectName, originalDirectory);
        if (options.install) {
            await installNpmPackages(rootApp, projectName, originalDirectory);
        }
        console.log();
        console.log(
            `${chalk.greenBright('El proyecto ha sido creado satisfactoriamente.')} \n`
        );
        if (!options.install) {
            console.log();
            console.log(
                `Para instalar los paquetes npm ejecuta en el directorio el siguiente comando:\n`+
                `       npm install`
            );
        }
        console.log();
        process.exit(0);
    } catch (onError) {
        console.error(
            `${chalk.red('La creacion del proyecto no puede continuar.')} \n`
        );
        process.exit(1);
    } 
}

async function getBoilerplate(rootApp, projectName, originalDirectory) {
    return await new Promise(async (resolve, reject) => {
        console.log('Obteniendo boilerplate...');
        console.log();
        const gitOptions = {
            baseDir: rootApp,
            binary: 'git',
            maxConcurrentProcesses: 6,
        }
        const git = simpleGit(gitOptions);
        try {
            // console.log(`${chalk.blueBright(`Clonando Repo...`)}`);
            // console.log();
            await git.clone(repoBoilerplate, rootApp);
            resolve();
        }
        catch(onError) {
            console.error(`${chalk.red(`Error al intentar ejecutar comando git...`)}`);
            console.log(onError.message);
            console.log()
            reject(onError);
        }
    })
}

function installNpmPackages(rootApp, projectName, originalDirectory){
    return new Promise((resolve, reject) => {
        console.log(`Instalando dependencias. Esto puede demorar unos minutos...`);
        console.log();
        execSync('npm i', {stdio: 'inherit'});
        // console.log(`${chalk.yellowBright(`Hasta aqui lo dejo el mio, por mas que puedo poner a instalar los paquetes por motivos de test eso va a demorar una puta vida kek.`)}`);
        resolve();
    })
}

function getForGitInstallation(){
    console.log('Verificando instalacion de Git...');
    console.log();
    return new Promise((resolve, reject) => {
        try {
            execSync('git --version', { stdio: 'ignore' })
            resolve();
        } catch(onError) {
            console.error(
                `${chalk.red('Git no instalado.')} \n` +
                `La creacion del proyecto no puede continuar. \n` +
                `Por favor instala la ultima version de Git para poder continuar`
            );
            reject();
        }
    });
}

function checkAppName(appName) {
    const validateResult = validateProjectName(appName);
    if (!validateResult.validForNewPackages) {
        console.error(
            `${chalk.red(`No se puede crear un proyecto llamado ${chalk.green(
                appName
            )} debido a que no cumple las restricciones de npm`)}`
        );
        const errors = validateResult.errors || [];
        const warns = validateResult.warnings || [];
        errors.forEach(err => {
            console.error(chalk.red(`   ERR: ${err}`));
        });
        warns.forEach(err => {
            console.error(chalk.yellow(`   WARN: ${err}`));
        });
        console.error(`${chalk.red('Por favor escoge un nombre diferente')}`);
        process.exit(1);
    }
}

function checkForLatestVersion() {
    return new Promise((resolve, reject) => {
        fetch(npmUrl)
            .then(checkStatus)
            .then(async res => {
                let json = await res.json();
                resolve(json.latest);
            })
            .catch(onError => {
                reject(onError);
            })
    })
}

function checkStatus(res) {
    if (res.ok) { // res.status >= 200 && res.status < 300
        return res;
    } else {
        throw Error(res.statusText);
    }
}

function checkForLatestVersionThen(latest) {
    if(latest && semver.lt(packageJson.version, latest)) {
        console.log();
        console.error(
            chalk.yellow(
                `Estas ejecutando \`${chalk.green(`${packageJson.name} ${packageJson.version}`)}\`, \n` + 
                `cuando la ultima version es \`${chalk.green(latest)}\`.\n\n` +
                `Este paquete esta hecho para correr siempre en su ultima version.` 
            )
        );
        console.log();
        console.log(
            `Por favor, remueve cualquier instalacion global que tengas de este paquete \n` +
            `y ejecuta el comando directamente desde ${chalk.blue(`npx`)}`
        );
        console.log();
        console.log(
            `Puedes removerlo usando el siguiente comando:\n` +
            `       npm uninstall -g ${packageJson.name}`
        );
        console.log();
        console.log(
            `Y luego vuelve a ejecutar el programa con el siguiente comando:\n` +
            `       npx ${packageJson.name} <appName>`
        );
        console.log();
        process.exit(1);
    }
}

module.exports = {
    init,
    // getTemplateInstallPackage,
  };