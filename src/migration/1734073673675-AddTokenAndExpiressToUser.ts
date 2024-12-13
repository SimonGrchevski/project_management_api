import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenAndExpiressToUser1734073673675 implements MigrationInterface {
    name = 'AddTokenAndExpiressToUser1734073673675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`verificationToken\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`verificationTokenExpires\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`verificationTokenExpires\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`verificationToken\``);
    }

}
