Work in progress to define the data model underlying a task-based mod, formally known as an app

We start by stating that a UserExperience data object is typically partitioned in sections. So UserExperienceSection is a data object modeling a piece of an app

UserExperienceSection is the super class. After that we're going to deal with named instances, like "OnboardingSection" or "DashboardSection", etc...

UserExperienceSection feels a better name than ContentSection

A mod has

- a UserExperience
- a UserExperience's tree/graph of sections - the data model, which should be able to editable by user or AI
- a tree of ui components that render the sections

Notes: We want in the future the ability for a user, or a user's AI agent, to modlulate what component renders what section, down ultimaterly to individual controls used to render/edit properties

A user's "activity" is the record / receipt of what they have done over time. It could also be calles Trail - as in leaving a trail.

* A history, log, of all actions they’ve taken, interactions they’ve had within the app, and the resulting data operations.

#### A user's "activityMap" would be showing how the activity maps to components used at the time.

##### Activity Map: The "What" Users Do**

An ****Activity Map**** **highlights** ****user actions**** **(e.g., posting, liking, editing, completing tasks) and the** ****relationships between those actions** .

#### **Section: A Container for Related Features or Content**

A ****"Section"**** **is a** ****group of related features, tools, or content**** **within an app. It’s a** ****structural unit**** **that organizes the app’s functionality.

#### **Section Map**

A ****"Section Map"**** **would visually represent the** ****different sections of the app**** **and how they relate to each other.

"Section" has:

- a name
- an icon
- optionally a visual style different from others
- DataSet (current DataQuery renamed), which is at minimun DataType+criteria. Plus ordering, etc.. Do they have one or more?
- content: The list/graph of expressions / data properties displayed within that section

  - A DataSet could model this the way DataQuery has readExpressions, which are intended to effienctly retrieve the sub graph of data for a piece of UI
- relatedSections: this isn't purely hierarchical as sections could loop back. It's a graph. So adjacentSections? Should we consider subSections that are embedded - vs related/adjacent/navigationSections which are section reacheable via the current one, but makes the current one go away? Or are they at core / data similar, and it's the component's job to decide what gets embedded vs what gets navigated to?

  - Voicemail Section has 2 related sections

    - Greeting
    - VoicemailDetailSection
      The selection of the list of voicemails is a DataSet: Voicemail type + criteria specifying the voicemail selected, which would be a "primaryKey == $primaryKey" kind of criteria. This would allow us to re-hydrate a user session and reconstruct selections.
- Sections needs to have a DataSetDescriptor, that is used to validate live that a dataSet assigned to it is valid for that section

* **Sortable**
* **Mutable**
  * **Both is editable?**

note: Removing a section from the flow / navigation should make it available in a known place somewhere else, so you can get it back to put it somewhere else or where it was

## Components and Sections

Component, or a subclass, would have a "sections" property, an array, ordered of Section DataObjects. For example, the Main component's sections then become the data behind a menu bar at the bottom of many mobile apps. The iOS call app Home/Main Section has 5 sections [favorites, recents, contacts, keypad, voicelmail].

## Naming

We need a name for the section, a data object modeling piece of an app architecture, one for a component that "displays" / render this section. There could be multiple varations of components rendering the same section data object.

PersonSection - The DataObject representing a section of an application that focuses on all persons. Prefixed by the data type's name, it becomes obvious.

PersonView - A component displaying a PersonSection

PersonDisplay ? A component displaying a PersonSection

PersonDetail(s?)Section - The DataObject representing a section of an application that focuses on the details of one person

PersonDetailView - A component displaying a PersonDetailSection

View is really a technical term. Users just use the names given to the sections. Like "go to the voicemail"

The truth is that in mod, we have a structure /data and /ui. so

/data/model/person.js/.mjson - It's clear it's a data level Person

/ui/person.mod - It's clear since it's in the ui folder that it is a component dealing with person

/ui/person-detail.mod - It's clear since it's in the ui folder that it is a component dealing with a person's detail

So we may not need to add a suffix?


## More Thoughts, on Navigation Rules?
Section has : user selection . A user selection doesn’t necessarily means navigation, it could mean showing a nested / embedded / subsection

But a navigation always happen following a user selection (defined here as a user interaction selecting a piece of data - a section is a piece of data, not just data objects): either selecting a data instance or clicking a button/link that represents a data set / section to go explore

So if we come up with “Navigation Rule” that is a way to evaluate the user selection, which needs to be a DataSet, with a criteria to derived an outcome —> be the section to go to, then we may have what we need.

The resulting section should be added to the navigation history, which mirror a web anchor as an internal navigation or  another page.

Then it comes down to mapping the section selected to a component to render it, and dealing with transitions which we have with the succession

https://developer.mozilla.org/en-US/docs/Web/API/Navigation

 Navigation needs to have:
 - an history that is the record of all navigation. So if one goes back and forth between 2 sections 3 times, the history would have 6 entries
 - a data structure that is the current state that is rendered and mutable, the “current navigation” that here would alternately has one or 2 entries.

Entering a Modal state means another succession branching out from where the modal started
