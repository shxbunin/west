import Card from './Card.js';
// import Creature from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    // constructor(...arg) {
    //     super(...arg);
    // }

    getDescriptions() {
        return [
            getCreatureDescription(this),
            super.getDescriptions()[0]
        ]
    }
}


// Основа для утки.
class Duck extends Creature {
    constructor() {
        super('Мирная утка', 2);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}


// Основа для собаки.
class Dog extends Creature {
    constructor(name = 'Пес-бандит', power = 3) {
        super(name, power);
    }
}

class Trasher extends Dog {
    constructor() {
        super('Громила', 5);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {
            continuation(value - 1)
        });
    }

    getDescriptions() {
        return [
            ...super.getDescriptions(),
            'Получает на 1 меньше урона'
        ]
    }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }

    static getInGameCount() { return this.inGameCount || 0; }

    static setInGameCount(value) { this.inGameCount = value; }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation();
    }

    doBeforeRemoving(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    }

    static getBonus() {
        const count = this.getInGameCount()
        return count * (count + 1) / 2;
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value - Lad.getBonus());
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    getDescriptions() {
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature')) {
            return [
                ...super.getDescriptions(),
                'Чем их больше темм они сильнее'
            ]
        }
        return super.getDescriptions();
    }
}

class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));
        for (let i = 0; i < oppositePlayer.table.length; i++) {
            taskQueue.push(onDone => {
                const oppositeCard = oppositePlayer.table[i];

                if (oppositeCard) {
                    this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
                }
            });
        }

        taskQueue.continueWith(continuation);
    }
}

const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];
const banditStartDeck = [
    new Lad(),
    new Lad(),
];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(2);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
