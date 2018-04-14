/* eslint-env browser, es6, jquery */

function Character(data) {
  $.extend(this, data);

  const charBox = $('<div class="character">');

  const name = $('<h3 class="char_name">');
  name.text(this.name);

  const img = $('<img class="char_img">');
  img.attr('src', `assets/img/${this.img}`);
  img.attr('alt', this.name);

  const hp = $('<h6 class="char_hp">');

  charBox.append([name, img, hp]);

  this.charBox = charBox;
  this.hpField = hp;

  this.reset();
}

Character.prototype.getID = function () {
  return $(this.charBox).attr('id');
};

Character.prototype.setID = function (id) {
  $(this.charBox).attr('id', id);
};

Character.prototype.removeFromGame = function () {
  $(this.charBox).detach();
};

Character.prototype.moveTo = function (div) {
  this.charBox.detach();
  div.find('.player_list_items').append(this.charBox);
  updatePlayerListVisibilities();
};

Character.prototype.increaseAttackPower = function () {
  this.attackPower += this.baseAttackPower;
};

Character.prototype.causeDamage = function (amount) {
  this.hp = Math.max(0, this.hp - amount);
  this.hpField.text(this.hp);
};

Character.prototype.playChooseSound = function (completion) {
  playSound(this.chooseSound, completion);
};

Character.prototype.playWinSound = function (completion) {
  playSound(this.winSound, completion);
};

Character.prototype.die = function (completion) {
  playSound(this.dieSound, completion);
  this.charBox.addClass('dead');
};

Character.prototype.reset = function () {
  this.charBox.removeClass('dead');
  this.attackPower = this.baseAttackPower;
  this.hp = this.initialHP;
  this.hpField.text(this.hp);
};

const characters = [];
let enemiesLeft;

let yourCharacter;
let defender;

let readyToAttack = false;
let gameOver = false;

let playersBox;
let yourPlayerBox;
let enemiesBox;
let fightBox;
let defenderBox;
let attackStatus;
let counterStatus;
let outcomeBox;
let outcomeText;

const currentSound = new Audio();
let soundPlaying = false;

function playSound(filename, completion) {
  $('button').attr('disabled', 'disabled');

  soundPlaying = true;
  $(currentSound).attr('src', `assets/audio/${filename}`);

  $(currentSound).on('ended', () => {
    $(currentSound).off('ended');
    soundPlaying = false;
    $('button').removeAttr('disabled');

    if (completion) {
      completion();
    }
  });

  currentSound.load();
  currentSound.play();
}

$(document).ready(() => {
  playersBox = $('#players');
  yourPlayerBox = $('#your_player');
  enemiesBox = $('#enemies');
  fightBox = $('#fight');
  defenderBox = $('#defender');
  attackStatus = $('#attack_status');
  counterStatus = $('#counter_status');
  outcomeBox = $('#outcome');
  outcomeText = $('#outcome_text');

  $.getJSON('assets/json/characters.json', (data) => {
    $.each(data.characters, (i, eachCharData) => {
      const newChar = new Character(eachCharData);

      newChar.setID(`sw_character_${i}`);
      characters.push(newChar);

      resetGame();
    });
  });

  $('#players').on('click', choosePlayer);
  $('#enemies').on('click', chooseEnemy);
  $('#attack_button').on('click', attack);
  $('#play_again > button').on('click', resetGame);
});

function resetGame() {
  yourCharacter = undefined;
  defender = undefined;
  readyToAttack = false;
  gameOver = false;

  $('#play_again').addClass('hidden');
  $(outcomeBox).addClass('hidden');

  $.each(characters, (_, eachChar) => {
    eachChar.reset();
    eachChar.moveTo(playersBox);
  });
}

function clickedCharacter(event) {
  const charBox = event.target.closest('.character');

  if (charBox === undefined) {
    return undefined;
  }

  const id = $(charBox).attr('id');

  return characters.find(each => $(each.charBox).attr('id') === id);
}

function choosePlayer(event) {
  if (yourCharacter) {
    return;
  }

  yourCharacter = clickedCharacter(event);
  const yourID = yourCharacter.getID();

  yourCharacter.playChooseSound(() => {
    enemiesLeft = characters.length - 1;

    yourCharacter.moveTo(yourPlayerBox);
    characters.filter(e => e.getID() !== yourID).forEach((e) => {
      e.moveTo(enemiesBox);
    });
  });
}

function chooseEnemy(event) {
  if (soundPlaying || gameOver || readyToAttack) {
    return;
  }

  attackStatus.text('');
  counterStatus.text('');

  readyToAttack = true;
  $([attackStatus, counterStatus]).text('');

  if (defender !== undefined) {
    defender.removeFromGame();
  }

  defender = clickedCharacter(event);
  defender.playChooseSound(() => {
    defender.moveTo(defenderBox);
  });
}

function attack() {
  if (soundPlaying || gameOver || !readyToAttack) {
    return;
  }

  const yourDamage = yourCharacter.attackPower;
  const enemyDamage = defender.counterAttackPower;

  attackStatus.text(`${yourCharacter.name} attacks for ${yourDamage} damage`);
  counterStatus.text('');

  defender.causeDamage(yourDamage);
  yourCharacter.increaseAttackPower();

  playSound('lightsaber.ogg', () => {
    if (defender.hp <= 0) {
      defender.die(() => {
        defender.charBox.detach();
        attackStatus.text('');
        readyToAttack = false;
        updatePlayerListVisibilities();

        if (--enemiesLeft === 0) {
          endGame();
        }

        counterStatus.text('');
      });

      return;
    }

    counterStatus.text(`${defender.name} attacks for ${enemyDamage} damage`);

    yourCharacter.causeDamage(enemyDamage);

    if (yourCharacter.hp <= 0) {
      yourCharacter.die(() => {
        endGame();
      });
    }
  });
}

function endGame() {
  readyToAttack = false;
  gameOver = true;

  outcomeBox.removeClass('hidden');

  if (yourCharacter.hp <= 0) {
    outcomeText.text('You Lost!');
    playSound('lose.ogg', showPlayAgainButton);
  } else {
    outcomeText.text('You Won!');
    yourCharacter.playWinSound(showPlayAgainButton);
  }
}

function showPlayAgainButton() {
  $('#play_again').removeClass('hidden');
}

function updatePlayerListVisibilities() {
  $('.player_list').each((i, list) => {
    const children = $(list).find('.player_list_items')[0].children;
    if (children.length > 0) {
      $(list).removeClass('hidden');
    } else {
      $(list).addClass('hidden');
    }
  });

  if (readyToAttack) {
    fightBox.removeClass('hidden');
  } else {
    fightBox.addClass('hidden');
  }
}
