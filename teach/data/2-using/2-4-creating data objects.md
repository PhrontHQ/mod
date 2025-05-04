# Creating Data Objects

There are multiple ways to create a DataObject. The difference is when does the main DataService become aware of that object.

However, the main DataService will only handle types of objects that are known to the RawDataServices it's been configued with. If the main DataService cannot find an ObjectDescriptor for the object being created, it won't work. RawDataServices are configured to handle a specific set of ObjectDescriptors.

The main Data Service (DataService.mainService) tracks changes on objects, to automatically update inverse relationships and track what change on objects, but it can only do so if is aware of those objects. So the best way to do that is to ask it to create an object:

1. Using DataService.mainService to create a DataObject:

   1. Require the file containing the the class to instantiate:
      const { UserSession } = require("mod/data/model/app/user-session");
   2. Or Require the file containing the the class's Object Descriptor:
      const UserSessionDescriptor = require("mod/data/model/app/user-session.mjson").montageObject;
   3. Create the data object:
      1. let aUserSession = DataService.mainService.createDataObject(UserSession);
      2. or
      3. let aUserSession = DataService.mainService.createDataObject(UserSession);
   4. From that point on, DataService.mainService will be aware of the objects
2. Creating a DataObject like any other JavaScript Object

   1. Require the file containing the the class to instantiate:
      const { UserSession } = require("mod/data/model/app/user-session");
   2. Instantiate the Object:

      1. let aUserSession = new UserSession()
   3. Set properties as usual:

      1. aUserSession.identity = someIdentity;
   4. Make the main service aware of the object so it can track it:

      1. DataService.mainService.mergeDataObject(aUserSession)
3. Creating a DataObject by deserializing it

   1. Deserialize the objects using Mod's Deserializer
   2. Then use DataService.mainService.mergeDataObject(aDeserializedObject)
