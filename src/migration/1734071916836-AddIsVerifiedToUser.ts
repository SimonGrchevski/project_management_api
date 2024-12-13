import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsVerifiedToUser1734071916836 implements MigrationInterface {
    name = 'AddIsVerifiedToUser1734071916836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`isEmailVerified\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`isEmailVerified\``);
    }

}
