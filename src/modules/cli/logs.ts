import chalk from "chalk";

export function showWarning(index: number, title: string, description: string) {

    console.log()
    console.log(chalk.yellow(`#${index} [WARNING]: ${ title }`))
    console.log(chalk.bold(description))
    console.log()

}