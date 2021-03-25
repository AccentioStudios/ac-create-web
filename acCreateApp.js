const packageJson = require('./package.json');
const commander = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const validateProjectName = require('validate-npm-package-name');

let projectName;
let options = [];

function init() {
    console.log('Bienvenido a AC-Create.');
    console.log();
    // Init
    const program = new commander.Command(packageJson.name)
    .version(packageJson.version);
    // Argument
    program
    .arguments('<project-directory>')
    .description('nombre del directorio', {
        'project-directory': 'Nombre del directorio y nombre de la aplicacion a crear'
    })
    .action(projectDirectory => {
        projectName = projectDirectory;
        console.log('El nombre de tu aplicacion va a ser:');
        console.log(`       ${chalk.cyan(projectName)}`);
    });
    // Options
    program
    .option('-t, --test', 'testing option')
    .allowUnknownOption()
    .parse(process.argv);
    options = program.opts();
    
    if(typeof projectName === 'undefined') {
        console.error('Please specify the project directory:');
        console.log(
            `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
        );
        process.exit(1);
    }
    console.log();
    createApp(projectName);
}

function createApp(projectName) {
    if (options.test) {
        console.log(`Ay el mio tamos creando un proyecto`);
        console.log(`       ${chalk.green(projectName)}`);
    }
    const root = path.resolve(projectName);
    const appName = path.basename(root);
    checkAppName(appName);
    // create dir
    if (fs.pathExistsSync(root)){
        console.error(`${chalk.red(`El directorio para la creacion del proyecto ya existe`)}`);
        console.error(`     ${chalk.green(root)}`);
        console.error(`${chalk.red(`No se puede continaur con la creacion del proyecto.`)}`);
        process.exit(1);
    }
    console.log('Creando directorio del proyecto...');
    fs.ensureDirSync(projectName);
    console.log(`     ${chalk.green(root)}`);
    console.log();

    const packageJson = {
        name: projectName,
        version: '0.1.0'
    };
    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify(packageJson, null, 2) + os.EOL
    );
    const originalDirectory = process.cwd();
    process.chdir(root);
    run(root, projectName);
}

function run(root, projectName) {
    console.log('Instalando dependencias. Esto puede demorar algunos minutos.');
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


module.exports = {
    init,
    // getTemplateInstallPackage,
  };