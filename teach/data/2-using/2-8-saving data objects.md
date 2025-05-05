# Saving Data Objects

As DataService.mainService tracks created data objects, changes made to data objects and deleted data objects, the way to persist those changes is to call

DataService.mainService.saveChanges()


saveChanges() is asynchronous therefore it returns a promise that will resolve if the save succeeds or reject if there are any error happining during saving.


There's a way to automatically have saveChanges() be called at the end of user interactions, effectivelly streaming changes to be persisted as they happen.



## Known Limitation

While saveChanges() internally creates a transaction when called, it will involves all known creation, deletion and changes at that time. There is no way yet to sandbox/group changes of a subset of data objects together.
