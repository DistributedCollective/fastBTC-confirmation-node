CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            txHash text,
            valueBtc INTEGER,
            dateAdded datetime,
            confirmedTime datetime
        );
CREATE TABLE IF NOT EXISTS last_processed_txid (
            id int primary key CHECK (id = 0),
            txId int not null,
            txHash text,
            dateAdded datetime
        );
INSERT INTO last_processed_txid VALUES(0,0,NULL,NULL) ON CONFLICT DO NOTHING;
