CREATE TABLE deposit_address (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    btc_deposit_address TEXT NOT NULL UNIQUE,
    rsk_address TEXT NOT NULL,
    created DATETIME NOT NULL
);

CREATE TABLE deposit_address_signature (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deposit_address_id INTEGER REFERENCES deposit_address(id) NOT NULL,
    signer TEXT NOT NULL,
    signature TEXT NOT NULL,
    created DATETIME NOT NULL,
    UNIQUE (deposit_address_id, signer)
);
