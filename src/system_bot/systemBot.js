//@flow

const didYouMean = require('didyoumean');

export interface SystemBot {
    handleMsg(msg:string) : Promise<string|null>,
    addHandler(command:string, handler:() => Promise<string|null>) : void,

}

const systemBotImplementation:SystemBot = {
    commands:{},
    addHandler(command:string, handler:() => Promise<string|null>) : void {

        this.commands[command] = handler

    },
    handleMsg: function(msg:string) : Promise<string|null> {

        if(typeof this.commands[msg] === 'undefined'){

            //tmp list of all command names
            const commandNames = [];

            //Fetch all command names
            Object.keys(this.commands).map((command) => commandNames.push(command));

            //Find alternative command names
            const altCommands = didYouMean(msg, commandNames);

            if(!altCommands){
                return new Promise((res, rej) => res(`I couldn't process '${msg}'. Type 'help' to list all commands.`));
            }

            return new Promise((res, rej) => res(`We couldn't process '${msg}'. Did you mean '${altCommands.toString()}'`))

        }

        return this.commands[msg]();
    }
};

export default systemBotImplementation;