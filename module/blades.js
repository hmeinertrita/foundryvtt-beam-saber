/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { preloadHandlebarsTemplates } from "./blades-templates.js";
import { bladesRoll, simpleRollPopup } from "./blades-roll.js";
import { BladesHelpers } from "./blades-helpers.js";
import { BladesActor } from "./blades-actor.js";
import { BladesItem } from "./blades-item.js";
import { BladesItemSheet } from "./blades-item-sheet.js";
import { BladesActorSheet } from "./blades-actor-sheet.js";
import { BladesCrewSheet } from "./blades-crew-sheet.js";

window.BladesHelpers = BladesHelpers;

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once("init", async function() {
  console.log(`Initializing Blades In the Dark System`);

  game.blades = {
    dice: bladesRoll
  }

  // Define Roll template.
  // CONFIG.Dice.template = "systems/beam-saber/templates/blades-roll.html"
  // CONFIG.Dice.tooltip = "systems/beam-saber/templates/blades-roll-tooltip.html"

  CONFIG.Item.entityClass = BladesItem;
  CONFIG.Actor.entityClass = BladesActor;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("blades", BladesActorSheet, { types: ["character"], makeDefault: true });
  Actors.registerSheet("blades", BladesCrewSheet, { types: ["squad"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("blades", BladesItemSheet, {makeDefault: true});
  preloadHandlebarsTemplates();


  // Multiboxes.
  Handlebars.registerHelper('multiboxes', function(selected, options) {

    let html = options.fn(this);

    let arr = selected

    if (!Array.isArray(selected)) {
      arr = [selected]
    }

    for (let value of arr) {
      if (value !== false) {
        const escapedValue = RegExp.escape(Handlebars.escapeExpression(value));
        const rgx = new RegExp(' value=\"' + escapedValue + '\"');
        html = html.replace(rgx, "$& checked=\"checked\"");
      }
    }

    return html;
  })

  // Trauma Counter
  Handlebars.registerHelper('traumacounter', function(selected, options) {

    let el = $( '<div></div>' )
    el.html(options.fn(this))
    const count = selected.length > 4 ? 4 : selected.length

    el.find('[value="' + count + '"]').attr('checked', true)
    return el.html()

  });

  // Load Counter
  Handlebars.registerHelper('loadcounter', function(selected, options) {

    let el = $( '<div></div>' )
    el.html(options.fn(this))

    const loadout = selected.reduce(((total, id) => total + parseInt(el.find('[value=' + id + ']').attr('data-load'))), 0)
    el.find('#loadout-count').html(loadout)

    console.log(el.html())

    return el.html()
  });

  // Equals handlebar.

  // NotEquals handlebar.
  Handlebars.registerHelper('noteq', (a, b, options) => {
    return (a !== b) ? options.fn(this) : '';
  });

  // ReputationTurf handlebar.
  Handlebars.registerHelper('storage', (storage, options) => {
    let el = $( '<div></div>' )
    el.html(options.fn(this))

    var storageUpgrades = parseInt(storage[0]);

    // Can't be more than 6.
    if (storageUpgrades > 2) {
      storageUpgrades = 2;
    }

    const enabledStorage = 4 * Math.pow(2, storageUpgrades)

    for (let i = 0; i <= 16; i++) {
      el.find('[value=' + i + ']').attr('disabled', i > enabledStorage)
    }
    return el.html();
  });

  Handlebars.registerHelper('crew_experience', (options) => {

    let html = options.fn(this);
    for (let i = 1; i <= 10; i++) {

      html += '<input type="radio" id="crew-experience-' + i + '" name="data.experience" value="' + i + '" dtype="Radio"><label for="crew-experience-' + i + '"></label>';
    }

    return html;
  });

  // Enrich the HTML replace /n with <br>
  Handlebars.registerHelper('html', (options) => {

    let text = options.hash['text'].replace(/\n/g, "<br />");

    return new Handlebars.SafeString(text);;
  });

});

/*
 * Hooks
 */
Hooks.on("preCreateOwnedItem", (parent_entity, child_data, options, userId) => {

  BladesHelpers.removeDuplicatedItemType(child_data, parent_entity);

  return true;
});

Hooks.on("createOwnedItem", (parent_entity, child_data, options, userId) => {

  BladesHelpers.callItemLogic(child_data, parent_entity);
  return true;
});

Hooks.on("deleteOwnedItem", (parent_entity, child_data, options, userId) => {

  BladesHelpers.undoItemLogic(child_data, parent_entity);
  return true;
});
// getSceneControlButtons
Hooks.on("renderSceneControls", async (app, html) => {
  let dice_roller = $('<li class="scene-control" title="Dice Roll"><i class="fas fa-dice"></i></li>');
  dice_roller.click(function() {
    simpleRollPopup();
  });
  html.append(dice_roller);
});
