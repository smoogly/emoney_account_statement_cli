// http://quicktype.io/ is a quick way to generate typescript definitions
// from sample responses, like the ones below.

export interface AccountEvents {
    total_count: string;
    count:       string;
    page_number: string;
    page_total:  string;
    limit:       string;
    txs:         TxElement[];
}

export interface TxElement {
    height:     string;
    txhash:     string;
    raw_log:    string;
    logs:       Log[];
    gas_wanted: string;
    gas_used:   string;
    tx:         TxTx;
    timestamp:  string;
}

export interface Log {
    msg_index: number;
    log:       string;
    events:    Event[];
}

export interface Event {
    type:       string;
    attributes: Attribute[];
}

export interface Attribute {
    key:   string;
    value: string;
}

export interface TxTx {
    type:  string;
    value: TxValue;
}

export interface TxValue {
    msg:        Msg[];
    fee:        Fee;
    signatures: Signature[];
    memo:       string;
}

export interface Fee {
    amount: AmountElement[];
    gas:    string;
}

export interface AmountElement {
    denom:  "ungm";
    amount: string;
}

export interface Msg {
    type:  "cosmos-sdk/MsgSend";
    value: MsgValue;
}

export interface MsgValue {
    from_address: string;
    to_address:   string;
    amount:       AmountElement | AmountElement[];
}

export interface Signature {
    pub_key:   PubKey;
    signature: string;
}

export interface PubKey {
    type:  string;
    value: string;
}
