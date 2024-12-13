import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity} from "typeorm";

@Entity()
export class User extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    username: string;

    @Column({unique: true})
    email: string;

    @Column({nullable: false})
    password: string;

    @Column({default: "Viewer"})
    role: string;

    @CreateDateColumn()
    created_at: Date;
    
    @Column({ type: 'boolean', default: false })
    isEmailVerified: boolean;
}