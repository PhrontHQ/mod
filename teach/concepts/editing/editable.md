Intro

* What defines editability

  * Editability is a data-level concept, in the end, for a known user, it's a true / false answer
  * With zero configuration, every UI control that can change data need to know whether it should allow editing or not
  * It always involves a party, user or system, with a known identity
  * It can be applied at the type level - can't edit Devices
  * It can be at the property level
  * It involves criteria / rules including the user identity, and logic based on the data model
  * It can involve specific instances of objects, but the rules can't assume direct knowledge of a speficic instance
    * It has to work on different databases, of the same logical one, across stages
    * on data sourcds of different type
    * which means those instances have to be defined by criteria on their natural properties, not on internal primary keys, which are different in any system - unless they're not and we impose that accross system with data coming from mod's serialization at first?
