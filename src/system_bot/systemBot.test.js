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

    })


});