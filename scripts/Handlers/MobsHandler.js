import { EnemyType } from "./EnemyType.js";

class Mob {
  constructor(id, typeId, posX, posY, health, enchantmentLevel, rarity) {
    this.id = id;
    this.typeId = typeId;
    this.posX = posX;
    this.posY = posY;
    this.health = health;
    this.enchantmentLevel = enchantmentLevel;
    this.rarity = rarity;
    this.tier = 0;
    this.type = EnemyType.Enemy;
    this.name = null;
    this.exp = 0;
    this.hX = 0;
    this.hY = 0;
  }
}

class Mist {
  constructor(id, posX, posY, name, enchant) {
    this.id = id;
    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.enchant = enchant;
    this.hX = 0;
    this.hY = 0;

    if (name.toLowerCase().includes("solo")) {
      this.type = 0;
    } else {
      this.type = 1;
    }
  }
}

export class MobsHandler {
  constructor(settings) {
    this.settings = settings;
    this.mobsList = [];
    this.mistList = [];
    this.mobinfo = {};
    this.harvestablesNotGood = [];
  }

  updateMobInfo(newData) {
    this.mobinfo = newData;
  }

  clear() {
    this.mobsList = [];
    this.mistList = [];
  }

  NewMobEvent(parameters) {
    const id = parseInt(parameters[0]);
    let typeId = parseInt(parameters[1]);

    const loc = parameters[7];
    let posX = loc[0];
    let posY = loc[1];

    let exp = 0;
    try {
      exp = parseFloat(parameters[13]);
    } catch (error) {
      exp = 0;
    }

    let name = null;
    try {
      name = parameters[32];
    } catch (error) {
      try {
        name = parameters[31];
      } catch (error2) {
        name = null;
      }
    }

    let enchant = 0;
    try {
      enchant = parameters[33];
    } catch (error) {
      enchant = 0;
    }

    let rarity = 1;
    try {
      rarity = parseInt(parameters[19]);
    } catch (error) {
      rarity = 1;
    }

    if (name != null) {
      this.AddMist(id, posX, posY, name, enchant);
    } else {
      this.AddEnemy(id, typeId, posX, posY, exp, enchant, rarity);
    }
  }

  AddEnemy(id, typeId, posX, posY, health, enchant, rarity) {
    if (this.mobsList.some((mob) => mob.id === id)) return;
    if (this.harvestablesNotGood.some((mob) => mob.id === id)) return;

    const h = new Mob(id, typeId, posX, posY, health, enchant, rarity);

    const minHP = localStorage.getItem("settingMinHP");
    if (h.health < minHP) return;

    if (this.mobinfo[typeId] != null) {
      const mobsInfo = this.mobinfo[typeId];
      h.tier = mobsInfo[0];
      h.type = mobsInfo[1];
      h.name = mobsInfo[2];

      if (h.type == EnemyType.LivingSkinnable) {
        if (!this.settings.harvestingLivingHide[`e${enchant}`][h.tier - 1]) {
          this.harvestablesNotGood.push(h);
          return;
        }
      } else if (h.type == EnemyType.LivingHarvestable) {
        let iG = true;

        switch (h.name) {
          case "fiber":
            if (!this.settings.harvestingLivingFiber[`e${enchant}`][h.tier - 1]) iG = false;
            break;
          case "hide":
            if (!this.settings.harvestingLivingHide[`e${enchant}`][h.tier - 1]) iG = false;
            break;
          case "Logs":
            if (!this.settings.harvestingLivingWood[`e${enchant}`][h.tier - 1]) iG = false;
            break;
          case "ore":
            if (!this.settings.harvestingLivingOre[`e${enchant}`][h.tier - 1]) iG = false;
            break;
          case "rock":
            if (!this.settings.harvestingLivingRock[`e${enchant}`][h.tier - 1]) iG = false;
            break;
        }

        if (!iG) {
          this.harvestablesNotGood.push(h);
          return;
        }
      } else if (h.type >= EnemyType.Enemy && h.type <= EnemyType.Boss) {
        const offset = EnemyType.Enemy;

        if (enchant === 0) {
          if (!this.settings.enemyLevels[h.type - offset]) return;
        }
      } else if (h.type == EnemyType.Drone) {
        if (!this.settings.avaloneDrones) return;
      } else if (h.type == EnemyType.MistBoss) {
        if (h.name == "CRYSTALSPIDER" && !this.settings.bossCrystalSpider) return;
        else if (h.name == "FAIRYDRAGON" && !this.settings.settingBossFairyDragon) return;
        else if (h.name == "VEILWEAVER" && !this.settings.bossVeilWeaver) return;
        else if (h.name == "GRIFFIN" && !this.settings.bossGriffin) return;
      } else if (h.type == EnemyType.Events) {
        if (!this.settings.showEventEnemies) return;
      } else if (!this.settings.showUnmanagedEnemies) return;
    } else if (!this.settings.showUnmanagedEnemies) return;

    this.mobsList.push(h);
	
if (enchant === 2 || enchant === 3 || enchant === 4 || enchant === 1) {
      this.playSound("sounds/mist_blue.mp3");
    }
	  
	  
    // 🔊 звук для особых ID мобов
    const specialMobIDs = [714, 702, 578, 720, 708, 377,];
    if (specialMobIDs.includes(typeId)) {
      this.playSound("sounds/mist_blue.mp3");
    }
  }

  removeMob(id) {
    this.mobsList = this.mobsList.filter((x) => x.id !== id);
    this.harvestablesNotGood = this.harvestablesNotGood.filter((x) => x.id !== id);
  }

  updateMobPosition(id, posX, posY) {
    var enemy = this.mobsList.find((enemy) => enemy.id === id);
    if (enemy) {
      enemy.posX = posX;
      enemy.posY = posY;
    }
  }

  updateEnchantEvent(parameters) {
    const mobId = parameters[0];
    const enchantmentLevel = parameters[1];

    var enemy = this.mobsList.find((mob) => mob.id == mobId);
    if (enemy) {
      enemy.enchantmentLevel = enchantmentLevel;
      return;
    }

    enemy = this.harvestablesNotGood.find((mob) => mob.id == mobId);
    if (!enemy) return;

    enemy.enchantmentLevel = enchantmentLevel;

    let hasToSwapFromList = false;

    if (enemy.type == EnemyType.LivingSkinnable) {
      if (this.settings.harvestingLivingHide[`e${enemy.enchantmentLevel}`][enemy.tier - 1]) {
        hasToSwapFromList = true;
      }
    } else if (enemy.type == EnemyType.LivingHarvestable) {
      switch (enemy.name) {
        case "fiber":
          if (this.settings.harvestingLivingFiber[`e${enemy.enchantmentLevel}`][enemy.tier - 1]) hasToSwapFromList = true;
          break;
        case "hide":
          if (this.settings.harvestingLivingHide[`e${enemy.enchantmentLevel}`][enemy.tier - 1]) hasToSwapFromList = true;
          break;
        case "Logs":
          if (this.settings.harvestingLivingWood[`e${enemy.enchantmentLevel}`][enemy.tier - 1]) hasToSwapFromList = true;
          break;
        case "ore":
          if (this.settings.harvestingLivingOre[`e${enemy.enchantmentLevel}`][enemy.tier - 1]) hasToSwapFromList = true;
          break;
        case "rock":
          if (this.settings.harvestingLivingRock[`e${enemy.enchantmentLevel}`][enemy.tier - 1]) hasToSwapFromList = true;
          break;
      }
    }

    if (hasToSwapFromList) {
      this.mobsList.push(enemy);
      this.harvestablesNotGood = this.harvestablesNotGood.filter((x) => x.id !== enemy.id);
    }
  }

  getMobList() {
    return [...this.mobsList];
  }

  AddMist(id, posX, posY, name, enchant) {
    if (this.mistList.some((mist) => mist.id === id)) return;
    const d = new Mist(id, posX, posY, name, enchant);
    this.mistList.push(d);

    // 🔊 звук для зачарованной мглы
    if (enchant === 2 || enchant === 3 || enchant === 4 || enchant === 1) {
      this.playSound("sounds/special_mob.mp3");
    }
  }

  removeMist(id) {
    this.mistList = this.mistList.filter((mist) => mist.id !== id);
  }

  updateMistPosition(id, posX, posY) {
    var mist = this.mistList.find((mist) => mist.id === id);
    if (mist) {
      mist.posX = posX;
      mist.posY = posY;
    }
  }

  updateMistEnchantmentLevel(id, enchantmentLevel) {
    var mist = this.mistList.find((mist) => mist.id === id);
    if (mist) {
      mist.enchant = enchantmentLevel;
    }
  }

  // 🔊 универсальный метод
  playSound(file) {
    try {
      const audio = new Audio(file);
      audio.volume = 0.9;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn("Cannot play sound:", e);
    }
  }
}
