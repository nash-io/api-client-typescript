import { Client } from '../client'

test('successfull logs in a user', async () => {
    const client = new Client
    const email = 'test@nash.io'
    const password = 'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34'

    await expect(client.login(email, password)).resolves.toBeTruthy
})

test('unsuccessfully logs in a user with invalid credentials', async () => {
    const client = new Client
    const email = 'test_invalid@nash.io'
    const password = 'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34'

    await expect(client.login(email, password)).rejects.toThrow(Error)
})