import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        // Find user ignoring organization scope for now (global login)
        // In real app, we might need to handle duplicate usernames across orgs if we allow that.
        // For now, usernames are unique globally in User table.
        const user = await this.usersService.findByUsername(username); // Need to add this method to UsersService

        if (user && user.password === pass) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            username: user.username,
            sub: user.id,
            role: user.role,
            organizationId: user.organizationId
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                organizationId: user.organizationId,
                fullName: user.fullName
            }
        };
    }
}
