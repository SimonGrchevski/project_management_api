import { createApp } from "../../app";
import { Express } from "express";
import { AppDataSource } from "../../data-source";

class TestApp {

    private static instance: TestApp | null = null;
    public app: Express;
    public dataSource:typeof AppDataSource;
    
    private constructor() {
        const appWithDataSource = createApp();
        this.app = appWithDataSource.app;
        this.dataSource = appWithDataSource.dataSource;
    }

    public static async getInstance(): Promise<TestApp> {
        if(!TestApp.instance){
            TestApp.instance =  new TestApp();
            await TestApp.instance.dataSource.initialize();
        }
        return TestApp.instance;
    }

    public static async cleanup(): Promise<void> {
        if(TestApp.instance){
            TestApp.instance.dataSource.destroy();
            TestApp.instance = null;
        }
    }

    public static cleanData = async () => {
        if(TestApp.instance)
        {
            const dataSource = TestApp.instance.dataSource
            const entities = dataSource.entityMetadatas;

            for (const entity of entities) {
                const repository = dataSource.getRepository(entity.name);
                await repository.query(`DELETE FROM ${entity.tableName};`);
                if (dataSource.options.type === "sqlite") {
                    await repository.query(
                        `DELETE FROM sqlite_sequence WHERE name='${entity.tableName}';`
                    );
                }

                
            }

        }
        
    }
}

export default TestApp;