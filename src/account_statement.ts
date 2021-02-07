import fetch from "node-fetch";
import Decimal from "decimal.js-light";
import { isAccountEvents } from "./api_responses/AccountEvents.schema.check";
import { AmountElement, TxElement } from "./api_responses/AccountEvents.schema";

export default async function printAccountStatement(account: string): Promise<void> {
    const [sent, received] = await Promise.all([
        getEvents(account, "message.sender"),
        getEvents(account, "transfer.recipient"),
    ]);

    const transactions = [
        ...sent.map(item => parseTx(item, "credit")),
        ...received.map(item => parseTx(item, "debit")),
    ].sort((t1, t2) => t1.timestamp - t2.timestamp); // Sort by timestamp asc

    let balance = new Decimal(0);
    const transactionsWithBalance = transactions.map(t => {
        balance = t.type === "debit" ? balance.plus(t.amount) : balance.minus(t.amount.plus(t.fee));
        return { ...t, balance };
    });

    const balanceDecimalPlaces = Math.max(...transactionsWithBalance.map(t => t.balance.decimalPlaces()), 0);
    const feeDecimalPlaces = Math.max(...transactionsWithBalance.map(t => t.type === "credit" ? t.fee.decimalPlaces() : 0), 0);
    const amountDecimalPlaces = Math.max(...transactionsWithBalance.map(
        t => t.type === "credit"
            ? t.amount.plus(t.fee).decimalPlaces()
            : t.amount.decimalPlaces()
    ), 0);

    const displayValues = transactionsWithBalance.reverse().map(t => ({
        amount: t.type === "credit"
            ? `-${ t.amount.plus(t.fee).toFixed(amountDecimalPlaces) }`
            : `+${ t.amount.toFixed(amountDecimalPlaces) }`,
        fee: t.type === "credit" ? t.fee.toFixed(feeDecimalPlaces) : "",
        balance: t.balance.toFixed(balanceDecimalPlaces),
        memo: t.memo,
        at: formatTs(t.timestamp),
    }));

    const balTitle = "Balance";
    const amountTitle = "Amount";
    const feeTitle = "Incl. Fee";
    const memoTitle = "Memo";
    const sentAtTitle = "Sent at";

    const amountWidth = Math.max(amountTitle.length, ...displayValues.map(v => v.amount.length));
    const feeWidth = Math.max(feeTitle.length, ...displayValues.map(v => v.fee.length));
    const balanceWidth = Math.max(balTitle.length, ...displayValues.map(v => v.balance.length));
    const memoWidth = Math.min(Math.max(memoTitle.length, ...displayValues.map(v => v.memo.length)), 20); // No more than 20 characters
    const tsWidth = Math.max(sentAtTitle.length, ...displayValues.map(v => v.at.length));

    const separator = pad("", 1, "left");
    console.log("\n\nRemaining balance:", balance.toString(), "NGM\n"); // tslint:disable-line:no-console
    if (displayValues.length === 0) { return console.log("No transactions\n\n"); } // tslint:disable-line:no-console

    console.log( // tslint:disable-line:no-console
        pad(balTitle, balanceWidth, "right"), separator,
        pad(amountTitle, amountWidth, "right"), separator,
        pad(feeTitle, feeWidth, "right"), separator,
        pad(sentAtTitle, tsWidth, "left"), separator,
        pad(memoTitle, memoWidth, "left")
    );
    displayValues.forEach(v => {
        console.log( // tslint:disable-line:no-console
            pad(v.balance, balanceWidth, "right"), separator,
            pad(v.amount, amountWidth, "right"), separator,
            pad(v.fee, feeWidth, "right"), separator,
            pad(v.at, tsWidth, "left"), separator,
            pad(v.memo, memoWidth, "left")
        );
    });
    console.log("\n"); // tslint:disable-line:no-console
}

const getJson = async (url: string): Promise<any> => {
    const resp = await fetch(url);
    return resp.json();
};
async function getEvents(acc: string, type: string, page = 1): Promise<TxElement[]> {
    const data = await getJson(`https://emoney.validator.network/light/txs?${ type }=${ acc }&page=${ page }`);
    if (!isAccountEvents(data)) { throw new Error(`Response does not match account events: ${ JSON.stringify(isAccountEvents.errors) }`); }

    if (Number(data.page_number) >= Number(data.page_total)) { return data.txs; }
    return [...data.txs, ...(await getEvents(acc, type, page + 1))];
}


interface TransactionData {
    type: "debit" | "credit";
    amount: Decimal;
    fee: Decimal;
    memo: string;
    timestamp: number;
}
const totAmount = (amount: AmountElement | AmountElement[]): Decimal => {
    const am = Array.isArray(amount) ? amount : [amount];
    if (am.length === 0) { return new Decimal(0); }
    return am.reduce((tot, x) => tot.plus(new Decimal(x.amount)), new Decimal(0))
        .dividedBy(1e6); // division converts ungm to ngm
};
function parseTx(tx: TxElement, type: "debit" | "credit"): TransactionData {
    return {
        type,
        amount: tx.tx.value.msg.reduce((tot, x) => tot.plus(totAmount(x.value.amount)), new Decimal(0)),
        fee: totAmount(tx.tx.value.fee.amount),
        memo: tx.tx.value.memo,
        timestamp: (new Date(tx.timestamp)).getTime(),
    };
}

function formatTs(ts: number) {
    const d = new Date(ts);
    const hours = d.getHours();
    return `${ d.getFullYear() }-${ d.getMonth() + 1 }-${ d.getDate() } ${ hours < 10 ? "0" : "" }${ hours }:${ d.getMinutes() }`;
}

function pad(str: string, size: number, align: "left" | "right"): string {
    const diff = size - str.length;
    if (diff < 0) { return str.slice(0, size); }
    const padding = (" ").repeat(diff);
    return align === "left" ? str + padding : padding + str;
}
