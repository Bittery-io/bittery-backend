import { InMemoryDatabaseException } from './in-memory-database-exception';
import { InMemoryDatabaseError } from './in-memory-database-error';

export class InMemoryDatabase<K, V> {
    private databaseCollection: Map<K, V> = new Map<K, V>();

    public setEntry(key: K, value: V) {
        if (this.databaseCollection) {
            return this.databaseCollection.set(key, value);
        }
        throw new InMemoryDatabaseException('Database has not been initialized', InMemoryDatabaseError.UNINITIALIZED);
    }

    public removeEntry(key: K): boolean {
        if (this.databaseCollection) {
            return this.databaseCollection.delete(key);
        }
        throw new InMemoryDatabaseException('Database has not been initialized', InMemoryDatabaseError.UNINITIALIZED);
    }

    public getValue(key: K): V {
        if (this.databaseCollection && this.databaseCollection.has(key)) {
            return this.databaseCollection.get(key)!;
        }
        throw new InMemoryDatabaseException(`Database is undefined/empty or key=${key} is not available`, InMemoryDatabaseError.TOKEN_UNAVAILABLE);
    }

    public hasEntry(key: K): boolean {
        return this.databaseCollection.has(key);
    }
}
