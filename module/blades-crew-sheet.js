
import { BladesSheet } from "./blades-sheet.js";

/**
 * @extends {BladesSheet}
 */
export class BladesCrewSheet extends BladesSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
  	  classes: ["beam-saber", "sheet", "actor"],
  	  template: "systems/beam-saber/templates/crew-sheet.html",
      width: 930,
      height: 1020,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "turfs"}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();

    // Calculate Turfs amount.
    // We already have Lair, so set to -1.
    let turfs_amount = -1;

    data.items.forEach(item => {

      if (item.type === "crew_type") {
        // Object.entries(item.data.turfs).forEach(turf => {turfs_amount += (turf.value === true) ? 1 : 0});
        Object.entries(item.data.turfs).forEach(([key, turf]) => {
          turfs_amount += (turf.value === true) ? 1 : 0;
        });
      }

    });
    data.data.turfs_amount = turfs_amount;

    return data;
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find('.item-sheet-open').click(ev => {
      const element = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(element.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const element = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(element.data("itemId"));
      element.slideUp(200, () => this.render(false));
    });

    // Add a new Cohort
    html.find('.add-item').click(ev => {
      BladesHelpers._addOwnedItem(ev, this.actor);
    });

    // Toggle Turf
    html.find('.turf-select').click(ev => {
      const element = $(ev.currentTarget).parents(".item");

      let item_id = element.data("itemId")
      let turf_id = $(ev.currentTarget).data("turfId");
      let turf_current_status = $(ev.currentTarget).data("turfStatus");
      let turf_checkbox_name = 'data.turfs.' + turf_id + '.value';

      this.actor.updateEmbeddedEntity('OwnedItem', {
        _id: item_id,
        [turf_checkbox_name]: !turf_current_status});
      this.render(false);
    });

    // Cohort Block Harm handler
    html.find('.cohort-block-harm input[type="radio"]').change(ev => {
      const element = $(ev.currentTarget).parents(".item");

      let item_id = element.data("itemId")
      let harm_id = $(ev.currentTarget).val();

      this.actor.updateEmbeddedEntity('OwnedItem', {
        _id: item_id,
        "data.harm": [harm_id]});
      this.render(false);
    });
  }

  /* -------------------------------------------- */

  /** override */
  _getFormData(form) {
    const FD = BladesHelpers.getFormDataHelper(form, this.editors);
    return FD;
  }

  /* -------------------------------------------- */
  /*  Form Submission                             */
	/* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {

    // Update the Item
    super._updateObject(event, formData);

    if (event.target && event.target.name === "data.tier") {
      this.render(true);
    }
  }
  /* -------------------------------------------- */

}
