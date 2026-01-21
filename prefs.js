// prefs.js — GNOME Shell ESM format for GNOME 46+
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class PulsePickPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'General',
        });

        const row = new Adw.SwitchRow({
            title: 'Show inactive devices',
            subtitle: 'Currently unused',
        });

        // Note: Uncomment when 'show-inactive' key is added to schema
        // const settings = this.getSettings();
        // settings.bind('show-inactive', row, 'active', Gio.SettingsBindFlags.DEFAULT);

        group.add(row);
        page.add(group);
        window.add(page);
    }
}
