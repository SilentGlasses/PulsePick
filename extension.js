/* PulsePick – Audio device selector for GNOME Shell 46+ */

import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import Gvc from 'gi://Gvc';

const AudioDeviceMenu = GObject.registerClass(
class AudioDeviceMenu extends QuickSettings.QuickMenuToggle {
    constructor() {
        super({
            title: _('Audio Devices'),
            iconName: 'audio-card-symbolic',
            toggleMode: false,
        });

        this._control = new Gvc.MixerControl({ name: 'PulsePick' });
        this._stateChangedId = null;
        this._defaultSinkChangedId = null;
        this._defaultSourceChangedId = null;
        this._streamAddedId = null;
        this._streamRemovedId = null;

        // Set up menu header
        this.menu.setHeader('audio-card-symbolic', _('Audio Devices'));

        // Connect signals
        this._stateChangedId = this._control.connect(
            'state-changed',
            () => {
                if (this._control.get_state() === Gvc.MixerControlState.READY) {
                    log('PulsePick: Mixer control ready, rebuilding menu');
                    this._rebuild();
                }
            }
        );

        this._defaultSinkChangedId = this._control.connect('default-sink-changed', () => this._rebuild());
        this._defaultSourceChangedId = this._control.connect('default-source-changed', () => this._rebuild());
        this._streamAddedId = this._control.connect('stream-added', () => this._rebuild());
        this._streamRemovedId = this._control.connect('stream-removed', () => this._rebuild());

        // Open mixer control
        try {
            this._control.open();
            log('PulsePick: Mixer control opened');
        } catch (e) {
            log(`PulsePick: Failed to open mixer control: ${e.message}`);
        }
    }

    _addDeviceSection(title, iconName, isInput) {
        if (!this._control || this._control.get_state() !== Gvc.MixerControlState.READY) {
            log(`PulsePick: Control not ready for ${title}`);
            return;
        }

        let streams, defaultStream;
        try {
            streams = isInput
                ? this._control.get_sources()
                : this._control.get_sinks();

            defaultStream = isInput
                ? this._control.get_default_source()
                : this._control.get_default_sink();
            
            log(`PulsePick: Found ${streams.length} ${title}`);
        } catch (e) {
            log(`PulsePick: Failed to get streams: ${e.message}`);
            return;
        }

        // Add section header
        const section = new PopupMenu.PopupMenuSection();
        const headerItem = new PopupMenu.PopupMenuItem(title, {
            reactive: false,
            can_focus: false,
        });
        headerItem.label.style_class = 'popup-subtitle-menu-item';
        headerItem.setIcon(iconName);
        section.addMenuItem(headerItem);

        // Add devices
        let hasDevices = false;
        log(`PulsePick: Iterating ${streams.length} streams for ${title}`);
        
        try {
        for (const stream of streams) {
            if (!stream) {
                log(`PulsePick: Skipping null stream`);
                continue;
            }
            
            log(`PulsePick: Stream: ${stream.description || stream.name} (virtual: ${stream.is_virtual})`);
            
            // TEMPORARILY DISABLED: Don't skip virtual devices for debugging
            // if (stream.is_virtual) {
            //     log(`PulsePick: Skipping virtual stream`);
            //     continue;
            // }

            hasDevices = true;
            const isDefault = defaultStream && stream.id === defaultStream.id;
            const deviceLabel = stream.description || stream.name;
            log(`PulsePick: Adding device: ${deviceLabel} (default: ${isDefault})`);

            const deviceItem = new PopupMenu.PopupMenuItem(deviceLabel);
            deviceItem.connect('activate', () => {
                try {
                    if (isInput)
                        this._control.set_default_source(stream);
                    else
                        this._control.set_default_sink(stream);
                } catch (e) {
                    log(`PulsePick: Failed to set default device: ${e.message}`);
                }
            });

            if (isDefault)
                deviceItem.setIcon('object-select-symbolic');

            section.addMenuItem(deviceItem);

            // Add ports as sub-items
            const ports = stream.get_ports?.() ?? [];
            for (const port of ports) {
                const isActive = stream.port === port.port;
                const portLabel = `    ${port.description}`;

                const portItem = new PopupMenu.PopupMenuItem(portLabel);
                portItem.connect('activate', () => {
                    try {
                        stream.change_port(port.port);
                    } catch (e) {
                        log(`PulsePick: Failed to change port: ${e.message}`);
                    }
                });

                if (isActive)
                    portItem.setIcon('object-select-symbolic');

                section.addMenuItem(portItem);
            }
        }
        } catch (e) {
            log(`PulsePick: Error iterating streams: ${e.message}`);
            log(`PulsePick: Stack: ${e.stack}`);
        }

        // Only add the section if there are devices
        if (hasDevices) {
            this.menu.addMenuItem(section);
            log(`PulsePick: Added ${title} section`);
        } else {
            log(`PulsePick: No devices to add for ${title}`);
        }
    }

    _rebuild() {
        log('PulsePick: Rebuilding menu');
        this.menu.removeAll();

        // Add output devices section
        this._addDeviceSection(
            _('Output Devices'),
            'audio-speakers-symbolic',
            false
        );

        // Add separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Add input devices section
        this._addDeviceSection(
            _('Input Devices'),
            'audio-input-microphone-symbolic',
            true
        );
    }

    destroy() {
        if (this._stateChangedId) {
            this._control?.disconnect(this._stateChangedId);
            this._stateChangedId = null;
        }
        if (this._defaultSinkChangedId) {
            this._control?.disconnect(this._defaultSinkChangedId);
            this._defaultSinkChangedId = null;
        }
        if (this._defaultSourceChangedId) {
            this._control?.disconnect(this._defaultSourceChangedId);
            this._defaultSourceChangedId = null;
        }
        if (this._streamAddedId) {
            this._control?.disconnect(this._streamAddedId);
            this._streamAddedId = null;
        }
        if (this._streamRemovedId) {
            this._control?.disconnect(this._streamRemovedId);
            this._streamRemovedId = null;
        }

        if (this._control) {
            this._control.close();
            this._control = null;
        }

        super.destroy();
    }
});

const AudioDeviceIndicator = GObject.registerClass(
class AudioDeviceIndicator extends QuickSettings.SystemIndicator {
    constructor() {
        super();

        // Create single combined menu with 2-column span for full width
        const menu = new AudioDeviceMenu();
        this.quickSettingsItems.push(menu);
    }

    destroy() {
        this.quickSettingsItems.forEach(item => item.destroy());
        super.destroy();
    }
});

export default class PulsePickExtension extends Extension {
    enable() {
        this._indicator = new AudioDeviceIndicator();
        const quickSettings = Main.panel.statusArea.quickSettings;
        
        // Add indicator
        quickSettings.addExternalIndicator(this._indicator);
        
        // Position the menu item below volume controls with 2-column width
        const menu = this._indicator.quickSettingsItems[0];
        quickSettings.menu._grid.set_child_below_sibling(menu, null);
        
        // Make it span 2 columns for full width
        quickSettings.menu._grid.layout_manager.child_set_property(
            quickSettings.menu._grid, menu, 'column-span', 2
        );
        
        log('PulsePick: Extension enabled');
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
        log('PulsePick: Extension disabled');
    }
}
