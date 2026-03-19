var DataService = require("mod/data/service/data-service").DataService,
    DataObjectDescriptor = require("mod/data/model/data-object-descriptor").DataObjectDescriptor,
    ModuleObjectDescriptor = require("mod/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    ModuleReference = require("mod/core/module-reference").ModuleReference,
    RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    defaultEventManager = require("mod/core/event/event-manager").defaultEventManager;

const AnimatedMovieDescriptor = require("spec/data/logic/model/animated-movie.mjson").montageObject;
const CategoyDescriptor = require("spec/data/logic/model/category.mjson").montageObject;
const movieDescriptor = require("spec/data/logic/model/movie.mjson").montageObject;

describe("A Transaction", function () {

});