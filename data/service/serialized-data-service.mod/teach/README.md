# SerializedDataService

A Data Service meant to return data objects serialized in Mod serialization file - .mjson
Those data objects need to have a UUID assigned as their identifier in their serialization 
to ensure repeated execution is idempotent.

## Generating UUIDs

We use UUID v7. The best way is to use this:

const uuid = require("core/uuid");
uuid.generate(undefined,true) -> '019a245c-1467-73c0-9c0e-c6e76846030f'

And store it manually in the serialization


## Serializing Object by Object vs Serializing all together

We either serialize all instances in one file per type, or we index/list them in one file and point to one file per instance. Pro/cons on both, to be experimented with. The second route is shown in data/instance/party/role.mod - meant to start that conversation.

data/instance/party/education/education-experience.mjson shows them all in one file.

What we need to test is if we can deserialize something like this:

    "DiplomaType": {
        "object": "data/instance/party/education/education-experience.mjson[DiplomaType]"
    },

In a similar way we can with symbols on exports in JS files. If that works already, or we make it work, then we can have references in objects' serialized properties to objects of different types stored in another file, without having to store objects in indidual files.

Store objects in indidual files might still be beneficial if they are rarely fetched all together, like a TimeZone: each user lives in one and we'll need that one. Few end-mods / user-mods will need to fetch all time zones.


In any case, internally, SerializedDataService will have to maintain an array of all instances so it can filter them with readOperation's criteria in order to handle a readOperation


## Returning raw data vs data

If the client behind the readOperation is in the same process, it's possible to do the following since SerializedDataService has natively access to DataObjects: 

    handleReadOperation: {
        value: function (readOperation) {
            //Find the matching stream
            let stream = this.contextForPendingDataOperation(readOperation) || readOperation.dataStream;
            let myResultObjects; //To be obtained by filtering an array with all instances of readOperation.target with readOperation's criteria

            //myResultObjects would have be made aware to the mainService with mainService.mergeDataObject(anObject) - see  Merging Data Objects that have been deserizalized bellow

            stream.addData(myResultObjects);
            this.unregisterPendingDataOperation(readOperation);
        }
    }

However, if SerializedDataService runs in the workel while the client is in a browser, there won't be a stream to find and SerializedDataService needs to return data with a read completed operation, converting data objects to raw data, anc caching that result as seen in the rough example bellow:

    _mapDataObjectsToRawDataPromises(dataObjects, rawDataPromises) {
        for (let aDataObject of dataObjects) {
            let mapping = this.mappingForObjectDescriptor(aDataObject.objectDescriptor);
            rawDataPromises.push(mapping.mapObjectToRawData(aDataObject, {})
            .then((rawData) => {
                let primaryKey = this.primaryKeyForTypeRawData(aDataObject.objectDescriptor, rawData);
                this._rawDataByObjectDescriptor(aDataObject.objectDescriptor).set(primaryKey, rawData);
            }));
        }
    }

## Merging Data Objects that have been deserizalized

Those Objects, if added straigt to a Stream needs to have been merged into the mainService with 

mainService.mergeDataObject(anObject) - see merge-data-object-example.js (non functional, use as pseudo code) for pointers


## serialized-data-objects.mjson

A file to put a collection to test - contains a copy of data/instance/party/education/education-experience.mjson right now to fill-in