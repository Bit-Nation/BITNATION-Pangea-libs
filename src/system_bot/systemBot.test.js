import sb from './systemBot'

describe('systemBot', () => {

    describe('addHandler', () => {

        test('success', () => {

            expect(sb.commands).toEqual({});

            sb.addHandler('profile:create', () => {
                return new Promise(res, rej => res('created profile'));
            });

            expect(sb.commands['profile:create']).toBeDefined();

        })

    });

    describe('handleMsg', () => {

        test('handle message with existing handler', () => {

            sb.addHandler('profile:create', function () {
                return new Promise((res, rej) => res('created profile'))
            });

            return expect(sb.handleMsg('profile:create')).resolves.toBe('created profile');

        });

        test('handle message with handler that doesn\'t exist', () => {

            return expect(sb.handleMsg('command_that_does_not_exist')).resolves.toBe('I couldn\'t process \'command_that_does_not_exist\'. Type \'help\' to list all commands.');

        });

        test('handle message with similar handler name', () => {

            sb.addHandler('profile:create', () => new Promise((res, rej) => res('')));
            
            return expect(sb.handleMsg('profile:crate')).resolves.toBe('We couldn\'t process \'profile:crate\'. Did you mean \'profile:create\'');

        })

    })


});