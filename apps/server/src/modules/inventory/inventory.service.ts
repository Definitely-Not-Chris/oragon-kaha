import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryService {
    findAll() {
        return ['Item 1', 'Item 2']; // Placeholder
    }
}
