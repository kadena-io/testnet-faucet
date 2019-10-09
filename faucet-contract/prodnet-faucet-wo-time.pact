(define-keyset 'faucet-admin-keyset (read-keyset "faucet-admin-keyset"))

(module coin-faucet 'faucet-admin-keyset

  "'coin-faucet' represents Kadena's Coin Faucet Contract."

  ;; TODO - use hashed import
  (use coin)

  ; --------------------------------------------------------------------------
  ; Schemas and Tables
  ; --------------------------------------------------------------------------

  (defschema history
    @doc "Table to record the behavior of addresses. Last transaction time,       \
    \ total coins earned, and total coins returned are inserted or updated at     \
    \ transaction. "
    total-coins-earned:decimal
    total-coins-returned:decimal
    )

  (deftable history-table: {history})

  ; --------------------------------------------------------------------------
  ; Constants
  ; --------------------------------------------------------------------------

  (defconst FAUCET_ACCOUNT:string 'coin-faucet)
  (defconst MAX_COIN_PER_REQUEST:decimal 20.0)

  ; --------------------------------------------------------------------------
  ; Coin Faucet Contract
  ; --------------------------------------------------------------------------

  (defun faucet-guard:guard () (create-module-guard 'faucet-admin))

  (defun request-coin:string (address:string amount:decimal)

    (enforce (<= amount MAX_COIN_PER_REQUEST)
      "Has reached maximum coin amount per request")

    (transfer FAUCET_ACCOUNT address amount)

    (with-default-read history-table address
      { "total-coins-earned": 0.0,
      "total-coins-returned": 0.0 }
      { "total-coins-earned":= total-coins-earned,
      "total-coins-returned":= total-coins-returned }

        (let  (( total-coins (+ amount total-coins-earned)))

        (write history-table address {
          "total-coins-earned": total-coins,
          "total-coins-returned": total-coins-returned }))))


  (defun create-and-request-coin:string (address:string address-guard:guard amount:decimal)
    @doc "Transfers AMOUNT of coins up to MAX_COIN_PER_REQUEST from the faucet    \
    \ account to the requester account at ADDRESS. Inserts or updates the         \
    \ transaction of the account at ADDRESS in history-table. Limits the number   \
    \ of coin requests by time, WAIT_TIME_PER_REQUEST "
    @model [(property (<= amount MAX_COIN_PER_REQUEST))]

    (enforce (<= amount MAX_COIN_PER_REQUEST)
      "Has reached maximum coin amount per request")

      (transfer-and-create FAUCET_ACCOUNT address address-guard amount)
      (insert history-table address {
        "total-coins-earned": amount,
        "total-coins-returned": 0.0 }))


  (defun return-coin:string (address:string amount:decimal)
    @doc "Returns the AMOUNT of coin from account at ADDRESS back to the faucet   \
    \ account after use. Updates the transaction of the account at ADDRESS in     \
    \ history-table keep track of behavior. "
    @model [(property (> amount 0.0))]

    (with-read history-table address
      {"total-coins-returned":= coins-returned}
      (transfer address FAUCET_ACCOUNT amount)
      (update history-table address
        {"total-coins-returned": (+ amount coins-returned)})))

  (defun read-history:object{history} (address:string)
    @doc "Returns history of the account at ADDRESS"
    (read history-table address))

)

(create-table history-table)
(create-account 'coin-faucet (faucet-guard))
