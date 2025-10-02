# Message Queue

This is a pattern that is needed, if only to scale pushing data to large amounts of recipients. Anything built around PostgreSQL means synergies whith what we've done so far, multi-cloud and independence.

## References

- [Postgres Message Queue (PGMQ)](https://github.com/pgmq/pgmq?tab=readme-ov-file)
    - [https://pgmq.github.io/pgmq/](https://pgmq.github.io/pgmq/)
- [Replace RabbitMQ with PostgreSQL](https://medium.com/@tihomir.manushev/lightweight-job-queue-with-postgresql-1c4af1b9fa13)
- [Devious SQL: Message Queuing Using Native PostgreSQL](https://www.crunchydata.com/blog/message-queuing-using-native-postgresql)
    - [Hacker News: Devious SQL: Message Queuing Using Native PostgreSQL](https://news.ycombinator.com/item?id=30119285)
    - 
- [graphile-worker: Job queue for PostgreSQL running on Node.js](https://github.com/graphile/worker)
    - [A high performance job queue for PostgreSQL, written in Node.js](https://worker.graphile.org)
- [pg-boss: a job queue built in Node.js on top of PostgreSQL in order to provide background processing and reliable asynchronous execution to Node.js applications.](https://github.com/timgit/pg-boss)
    pg-boss relies on Postgres's SKIP LOCKED, a feature built specifically for message queues to resolve record locking challenges inherent with relational databases. This provides exactly-once delivery and the safety of guaranteed atomic commits to asynchronous job processing.
    - [https://timgit.github.io/pg-boss/#/](https://timgit.github.io/pg-boss/#/)
- [AWS EventBridge](https://docs.aws.amazon.com/eventbridge/) 
    - [Integrating Amazon EventBridge into your serverless applications](https://aws.amazon.com/blogs/compute/integrating-amazon-eventbridge-into-your-serverless-applications/)
    - [configure EventBridge rules for target to receive events](https://www.google.com/search?client=safari&rls=en&q=configure+EventBridge+rules+for+target+to+receive+events&ie=UTF-8&oe=UTF-8)
    - [Event bus targets in Amazon EventBridge
](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-targets.html)
    - [Creating rules that react to events in Amazon EventBridge
](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule.html)
    - [UNDERSTANDING EVENTBRIDGE TARGETS](https://serverlessland.com/serverless/visuals/eventbridge/understanding-eventbridge-targets)
    - [How do I create a custom event pattern for an EventBridge rule?](https://repost.aws/knowledge-center/eventbridge-create-custom-event-pattern)
    - [How to write Event Bridge Rules](https://medium.com/@inderjotsingh141/how-to-write-event-bridge-rules-1cce4da98c04)
    - []