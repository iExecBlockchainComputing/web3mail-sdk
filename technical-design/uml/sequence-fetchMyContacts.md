# fetchMyContacts

```mermaid
sequenceDiagram
    title fetchMyContacts

    box Client environment
        actor User
        participant SDK as @iexec/web3mail
    end
    box iExec Protocol
        participant Market as Marketplace API
        participant Graph as The Graph
    end

    User -) SDK: fetchMyContacts()

    SDK ->> Market: fetchDatasetOrderbook(app,<br>requester)

    Market -->> SDK : datasetorder[]

    activate SDK

    SDK ->> SDK: myContacts.push({address,<br> owner, <br>publicationTimestamp})

    deactivate SDK

    SDK ->> Graph: protectedDatas(requiredSchema,<br>id,<br>start,<br>range)

    Graph -->> SDK: protectedDatas[]

    activate SDK

    SDK ->> SDK: checkProtectedDataValidity(protectedData)

    deactivate SDK
    

    SDK -->> User: validContacts[]
```

## resources

- **dataset**: iExec's protocol NFT (Non-Fungible Token) providing governance over a confidential data, the dataset is the backbone of a protected data
- **datasetorder**: iExec's protocol document expressing a subset of governance rules signed by the owner of a dataset, datasetorders are referred as GrantedAccess by DataProtector
- [iExec protocol documentation](https://protocol.docs.iex.ec)

[<-- back](../index.md)
