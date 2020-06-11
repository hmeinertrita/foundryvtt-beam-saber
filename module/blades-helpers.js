export class BladesHelpers {

  /**
   * Removes a duplicate item type from charlist.
   *
   * @param {Object} item_data
   * @param {Entity} actor
   */
  static removeDuplicatedItemType(item_data, actor) {

    let distinct_types = ["crew_reputation", "class", "vice", "background", "heritage"];
    let should_be_distinct = distinct_types.includes(item_data.type);
    // If the Item has the exact same name - remove it from list.
    // Remove Duplicate items from the array.
    actor.items.forEach(i => {
      let has_double = (item_data.type === i.data.type);
      if (i.data.name === item_data.name || (should_be_distinct && has_double)) {
        actor.deleteOwnedItem(i.id);
      }
    });
  }

  /**
   * _getFormData() override helper.
   * @param {*} form
   */
  static getFormDataHelper(form, editors) {
    console.log('pulling form data')

    const FD = new FormData(form);
    const dtypes = {};
    const editorTargets = Object.keys(editors);

    // Always include checkboxes
    for ( let el of form.elements ) {
      if ( !el.name ) continue;

      // Handle Radio groups
      if ( form[el.name] instanceof RadioNodeList ) {

        const inputs = Array.from(form[el.name]);
        if ( inputs.every(i => i.disabled) ) FD.delete(k);

        let values = "";
        let type = "Checkboxes";
        values = inputs.map(i => i.checked ? i.value : false).filter(i => i);

        FD.set(el.name, JSON.stringify(values));
        dtypes[el.name] = 'Radio';
      }

      // Remove disabled elements
      else if ( el.disabled ) FD.delete(el.name);

      // Checkboxes
      else if ( el.type == "checkbox" ) {
          FD.set(el.name, el.checked || false);
          dtypes[el.name] = "Boolean";
      }

      // Include dataset dtype
      else if ( el.dataset.dtype ) dtypes[el.name] = el.dataset.dtype;
    }

    // Process editable images
    for ( let img of form.querySelectorAll('img[data-edit]') ) {
      if ( img.getAttribute("disabled") ) continue;
      let basePath = window.location.origin+"/";
      if ( ROUTE_PREFIX ) basePath += ROUTE_PREFIX+"/";
      FD.set(img.dataset.edit, img.src.replace(basePath, ""));
    }

    // Process editable divs (excluding MCE editors)
    for ( let div of form.querySelectorAll('div[data-edit]') ) {
      if ( div.getAttribute("disabled") ) continue;
      else if ( editorTargets.includes(div.dataset.edit) ) continue;
      FD.set(div.dataset.edit, div.innerHTML.trim());
    }

    // Handle MCE editors
    Object.values(editors).forEach(ed => {
      if ( ed.mce ) {
        FD.delete(ed.mce.id);
        if ( ed.changed ) FD.set(ed.target, ed.mce.getContent());
      }
    });

    // Record target data types for casting
    FD._dtypes = dtypes;
    return FD;

  }

  /**
   * Add item modification if logic exists.
   * @param {Object} item_data
   * @param {Entity} entity
   */
  static callItemLogic(item_data, entity) {

    if ('logic' in item_data.data) {
      let logic = JSON.parse(item_data.data.logic);

      if (logic) {
        // Different logic behav. dep on operator.
        switch (logic.operator) {

          // Add when creating.
          case "addition":
            entity.update({
              [logic.attribute]: Number(BladesHelpers.getNestedProperty(entity, "data." + logic.attribute)) + logic.value
            });
            break;

        }
      }

    }

  }

  /**
   * Undo Item modifications when item is removed.
   * @param {Object} item_data
   * @param {Entity} entity
   */
  static undoItemLogic(item_data, entity) {

    if ('logic' in item_data.data) {
      let logic = JSON.parse(item_data.data.logic)

      if (logic) {
        // Different logic behav. dep on operator.
        switch (logic.operator) {
          // Subtract when removing.
          case "addition":
            entity.update({
              [logic.attribute]: Number(BladesHelpers.getNestedProperty(entity, "data." + logic.attribute)) - logic.value
            });
            break;

        }
      }
    }

  }

  /**
   * Get a nested dynamic attribute.
   * @param {Object} obj
   * @param {string} property
   */
  static getNestedProperty(obj, property) {
    return property.split('.').reduce((r, e) => {
        return r[e];
    }, obj);
  }


  /**
   * Add item functionality
   */
  static _addOwnedItem(event, actor) {

    event.preventDefault();
    const a = event.currentTarget;
    const item_type = a.dataset.itemType;

    let data = {
      name: randomID(),
      type: item_type
    };
    return actor.createEmbeddedEntity("OwnedItem", data);
  }

  /**
   * Get the list of all available ingame items by Type.
   *
   * @param {string} item_type
   * @param {Object} game
   */
  static async getAllItemsByType(item_type, game) {

    let list_of_items = [];
    let game_items = [];
    let compendium_items = [];

    game_items = game.items.filter(e => e.type === item_type).map(e => {return e.data});

    let pack = game.packs.find(e => e.metadata.name === item_type);
    let compendium_content = await pack.getContent();
    compendium_items = compendium_content.map(e => {return e.data});

    list_of_items = game_items.concat(compendium_items);

    return list_of_items;

  }

  /* -------------------------------------------- */

}
