
- UUIDs are 128 bits / 16 bytes
- PostgreSQL stores inet/cidr as 19 bytes, so opportunity to encode additional data without losing randomness and risk increasing collision risks.
    - Additional info could be:
        - type / subclass -> table where full record lives, possibly useful for polymorphic relaationships?
        - location / shard / instance storing the record with that primary key

[Designing Custom UUIDs](https://noelwelsh.com/posts/building-an-id-scheme/)
[modulo operation on uuid to determine shard_id](https://stackoverflow.com/questions/33011012/modulo-operation-on-uuid-to-determine-shard-id)
[Longer Universally Unique IDentifiers (UUIDs) draft-davis-uuidrev-uuid-long-00](https://datatracker.ietf.org/doc/draft-davis-uuidrev-uuid-long/)
[how many bits of random data does a UUID v7 have?](https://share.google/aimode/NtHX58X6jckyeiIiQ)
[what are type 8 UUIDs?](https://share.google/aimode/bmor13WpTaFIlNF01)
[TIL: 8 versions of UUID and when to use them](https://www.ntietz.com/blog/til-uses-for-the-different-uuid-versions/)
[Show HN: PgDog – Shard Postgres without extensions](https://news.ycombinator.com/item?id=44099187)

