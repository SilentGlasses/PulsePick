/* PulsePick – Simplified test version */

import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import Gvc from 'gi://Gvc';

const SimpleAudioMenu = GObject.registerClass(
class SimpleAudioMenu extends QuickSettings.QuickMenuToggle {
    constructor() {
        super({
            title: _('Audio Devices'),
            iconName: 'audio-card-symbolic',
            toggleMode: false,
        });

        this._control = new Gvc.MixerControl({ name: 'PulsePick' });

        this._control.connect('state-changed', () => {
            if (this._control.get_state() === Gvc.MixerControlState.READY)
                this._rebuild();
        });

        this._control.open();
    }

    _rebuild() {
        this.menu.removeAll();
        
        // Just add ALL sinks directly - no filtering, no sections
        const sinks = this._control.get_sinks();
        const defaultSink = this._control.get_default_sink();
        
        this.menu.addAction(`Found ${sinks.length} output devices`, () => {});
        
        for (const sink of sinks) {
            const isDefault = defaultSink && sink.id === defaultSink.id;
            const label = `${sink.description || sink.name} ${isDefault ? '✓' : ''}`;
            
            this.menu.addAction(label, () => {
                this._control.set_default_sink(sink);
            });
        }
        
        // Add sources too
        const sources = this._control.get_sources();
        const defaultSource = this._control.get_default_source();
        
        this.menu.addAction('', () => {});  // Spacer
        this.menu.addAction(`Found ${sources.length} input devices`, () => {});
        
        for (const source of sources) {
            const isDefault = defaultSource && source.id === defaultSource.id;
            const label = `${source.description || source.name} ${isDefault ? '✓' : ''}`;
            
            this.menu.addAction(label, () => {
                this._control.set_default_source(source);
            });
        }
    }

    destroy() {
        if (this._control) {
            this._control.close();
            this._control = null;
        }
        super.destroy();
    }
});

const AudioIndicator = GObject.registerClass(
class AudioIndicator extends QuickSettings.SystemIndicator {
    constructor() {
        super();
        this.quickSettingsItems.push(new SimpleAudioMenu());
    }

    destroy() {
        this.quickSettingsItems.forEach(item => item.destroy());
        super.destroy();
    }
});

export default class PulsePickExtension extends Extension {
    enable() {
        this._indicator = new AudioIndicator();
        const quickSettings = Main.panel.statusArea.quickSettings;
        
        quickSettings.addExternalIndicator(this._indicator);
        
        // Make the menu span 2 columns for full width
        const menu = this._indicator.quickSettingsItems[0];
        quickSettings.menu._grid.layout_manager.child_set_property(
            quickSettings.menu._grid, menu, 'column-span', 2
        );
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
