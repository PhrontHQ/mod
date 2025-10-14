# Support Multiple Versions of a Same Object Concurrently 



[https://marksegal-etlv.medium.com/the-power-of-postgresql-arrays-b4b1abe35d1f](https://marksegal-etlv.medium.com/the-power-of-postgresql-arrays-b4b1abe35d1f)


- The gist of this idea would be to use Arrays for each property. Arrays can contain any type of type in PG, including custom types, so no restriction
- branchNames column: an Array serving as keys / hash / acts as a “branch” name list: The array contains the branch names
- Each property becomes an array, whose value index matches that of the index of that branch name in branchNames array
- Every query uses the branch name - default main -  to find values, 
- Using COALESCE("ServiceEngagement"."templateName"::jsonb #>> '{en,US}', "ServiceEngagement"."templateName"::jsonb #>> '{en,*}') to default to main’s value if not overridden
- This acts as a map where array_position(“branchNames, “draft”) gives us the index of the value to use for all other properties


# problems / thoughts
- what happens if different people create a similar branch name? It would have to mean they're editing the same branch as somone else. "private branches" could be preceded by their user's primaryKey UUID. 
- we'd need to capture the existenceTimeRange (existenceRange? Existence is fundamentally tied to time, so maybe we don't need to have "time" in the name?) of a branch
- "stash" could be a very handy way to keep some values aside that could be easily found again, like in git? This could be exposed as a "Stash" user-level action, as an option to "Save"?
- We would need to expose to user the concept of a "branch" - called a sandbox? A scratchpad? 

