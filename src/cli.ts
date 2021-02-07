import * as yargs from "yargs";
import { hideBin } from "yargs/helpers";
import printAccountStatement from "./account_statement";

yargs(hideBin(process.argv))
    .command(
        "* <account>", "Print e-Money account statement",
        argv => argv.positional("account", {
            describe: "Account number to print statement for",
            type: "string",
            demandOption: true,
        }),
        argv => {
            printAccountStatement(argv.account).catch(e => {
                console.error("Error fetching account statement");
                console.error(e);
                process.exit(1);
            });
        }
    )

    .demandCommand(1, "Please specify command")
    .version(false)
    .parse();
