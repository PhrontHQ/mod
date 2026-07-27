## Design

### mod#main
#### DataService

##### Change Tracking
`DataService` receives all change events dispatched for data objects and tracks the objects created/deleted/changed and 
the associated changes. 

`DataService.createdDataObjects` -- All objects that have not been persisted
`DataService.changedDataObjects` -- All persisted objects that have changes in memory that have not been persisted
`DataService.deletedDataObjects` -- All persisted objects that are deleted in memory, but the deletion has not yet been persisted. 
`DataService.dataObjectChanges` -- Tracks the changes that have not been persisted

##### Saving
`DataService` autosaves at a regular interval. On save, `DataService` creates a transaction that includes ALL creations/deletions/updates that have not been persisted and executes it. If the transaction succeeds, the objects in the transaction are removed the registries mentioned above. 

#### Transaction
`Transaction` has little to no logic of it's own and just serves as a vehicle to track the objects/changes being saved. 


### Proposal
#### Issues with current
The design in mod#main as of this writing has a couple of significant downsides.
1. A single transaction can include unrelated objects which is a problem if one fails to save. The success of saving an object in one 
   part of the graph should not depend on the success of saving one in another part of the graph

2. An objects changes/deletion/creation can be unnecessarily separated across multiple transactions. For example, say a new object is created with the intent to immediately update several properties on it. Mod should allow for those changes to be saved in a single create-transaction when all of the properties are updated. With the current design, the creation may be in a separate transaction from the updates and the updates could be further subdivided into multiple transactions.

#### New Design
1. Move change tracking from `DataService` to `Transaction` (or perhaps another new class like `EditingContext`)
2. `Transaction` (or `EditingContext`) would receive an object or objects to track. These can be created by anywhere -- Components, RawDataServices, etc. 
3. `DataService` implements a new public method `saveChangesForTransaction` (or `saveEditingContext`)) that can be called on the `rootService` from anywhere
4. `DataService` creates and manages a default `Transaction` (or `EditingContext`) that will track changes for any objects that are not handled by another transaction/editing context



## Current Status of of 4/10/2026
- `createdDataObjects`, `changedDataObjects`, `deletedDataObjects`, and `dataObjectChanges` were moved to `Transaction`
- All methods that interact with those registries were updated to reference a `Transaction`
- `DataService` creates a default transaction that tracks all changes