import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Brightness from '../../../services/brightness.js';
import Indicator from '../../../services/indicator.js';

const { GLib } = imports.gi;
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button, Label, Overlay} = Widget;
const { execAsync, exec } = Utils;
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';

//test change
const CUSTOM_MODULE_CONTENT_INTERVAL_FILE = `${GLib.get_home_dir()}/.cache/ags/user/scripts/custom-module-interval.txt`;
const CUSTOM_MODULE_CONTENT_SCRIPT = `${GLib.get_home_dir()}/.cache/ags/user/scripts/custom-module-poll.sh`;
const CUSTOM_MODULE_LEFTCLICK_SCRIPT = `${GLib.get_home_dir()}/.cache/ags/user/scripts/custom-module-leftclick.sh`;
const CUSTOM_MODULE_RIGHTCLICK_SCRIPT = `${GLib.get_home_dir()}/.cache/ags/user/scripts/custom-module-rightclick.sh`;
const CUSTOM_MODULE_MIDDLECLICK_SCRIPT = `${GLib.get_home_dir()}/.cache/ags/user/scripts/custom-module-middleclick.sh`;
const CUSTOM_MODULE_SCROLLUP_SCRIPT = `${GLib.get_home_dir()}/.cache/ags/user/scripts/custom-module-scrollup.sh`;
const CUSTOM_MODULE_SCROLLDOWN_SCRIPT = `${GLib.get_home_dir()}/.cache/ags/user/scripts/custom-module-scrolldown.sh`;

const BarGroup = ({ child }) => Box({
    className: 'bar-group-margin bar-sides',
    children: [
        Box({
            className: 'bar-group bar-group-standalone bar-group-pad-system',
            children: [child],
        }),
    ]
});

const BarResource = (name, icon, command, circprogClassName = 'bar-batt-circprog', textClassName = 'txt-onSurfaceVariant', iconClassName = 'bar-batt') => {
    const resourceCircProg = AnimatedCircProg({
        className: `${circprogClassName}`,
        vpack: 'center',
        hpack: 'center',
    });
    const resourceProgress = Box({
        homogeneous: true,
        children: [Overlay({
            child: Box({
                vpack: 'center',
                className: `${iconClassName}`,
                homogeneous: true,
                children: [
                    MaterialIcon(icon, 'small'),
                ],
            }),
            overlays: [resourceCircProg]
        })]
    });
    const resourceLabel = Label({
        className: `txt-smallie ${textClassName}`,
    });
    const widget = Box({
        className: `spacing-h-4 ${textClassName}`,
        children: [
            resourceProgress,
            resourceLabel,
        ],
        setup: (self) => self
            .poll(5000, () => execAsync(['bash', '-c', command])
                .then((output) => {
                    resourceCircProg.css = `font-size: ${Number(output)}px;`;
                    resourceLabel.label = `${Math.round(Number(output))}%`;
                    widget.tooltipText = `${name}: ${Math.round(Number(output))}%`;
                }).catch(print))
        ,
    });
    return widget;
}

const SystemResourcesOrCustomModule = () => {
    // Check if ~/.cache/ags/user/scripts/custom-module-poll.sh exists
    if (GLib.file_test(CUSTOM_MODULE_CONTENT_SCRIPT, GLib.FileTest.EXISTS)) {
        const interval = Number(Utils.readFile(CUSTOM_MODULE_CONTENT_INTERVAL_FILE)) || 5000;
        return BarGroup({
            child: Button({
                child: Label({
                    className: 'txt-smallie txt-onSurfaceVariant',
                    useMarkup: true,
                    setup: (self) => Utils.timeout(1, () => {
                        self.label = exec(CUSTOM_MODULE_CONTENT_SCRIPT);
                        self.poll(interval, (self) => {
                            const content = exec(CUSTOM_MODULE_CONTENT_SCRIPT);
                            self.label = content;
                        })
                    })
                }),
                onPrimaryClickRelease: () => execAsync(CUSTOM_MODULE_LEFTCLICK_SCRIPT).catch(print),
                onSecondaryClickRelease: () => execAsync(CUSTOM_MODULE_RIGHTCLICK_SCRIPT).catch(print),
                onMiddleClickRelease: () => execAsync(CUSTOM_MODULE_MIDDLECLICK_SCRIPT).catch(print),
                onScrollUp: () => execAsync(CUSTOM_MODULE_SCROLLUP_SCRIPT).catch(print),
                onScrollDown: () => execAsync(CUSTOM_MODULE_SCROLLDOWN_SCRIPT).catch(print),       
            })
        });
    } else return BarGroup({
        child: Box({
            children: [
                BarResource('RAM Usage', 'memory', `LANG=C free | awk '/^Mem/ {printf("%.2f\\n", ($3/$2) * 100)}'`,
                    'bar-ram-circprog', 'bar-ram-txt', 'bar-ram-icon'),
                // BarResource('Swap Usage', 'swap_horiz', `LANG=C free | awk '/^Swap/ {if ($2 > 0) printf("%.2f\\n", ($3/$2) * 100); else print "0";}'`,
                //     'bar-swap-circprog', 'bar-swap-txt', 'bar-swap-icon'),
                BarResource('CPU Usage', 'settings_motion_mode', `LANG=C top -bn1 | grep Cpu | sed 's/\\,/\\./g' | awk '{print $2}'`,
                    'bar-cpu-circprog', 'bar-cpu-txt', 'bar-cpu-icon'),
            ],
        })
    });
}

// const WindowTitle = async () => {
//     try {
//         const Hyprland = (await import('resource:///com/github/Aylur/ags/service/hyprland.js')).default;
//         return Widget.Scrollable({
//             hexpand: true, vexpand: true,
//             hscroll: 'automatic', vscroll: 'never',
//             child: Widget.Box({
//                 vertical: true,
//                 children: [
//                     Widget.Label({
//                         xalign: 0,
//                         truncate: 'end',
//                         maxWidthChars: 10, // Doesn't matter, just needs to be non negative
//                         className: 'txt-smaller bar-topdesc txt',
//                         setup: (self) => self.hook(Hyprland.active.client, label => { // Hyprland.active.client
//                             label.label = Hyprland.active.client.class.length === 0 ? 'Desktop' : Hyprland.active.client.class;
//                         }),
//                     }),
//                     Widget.Label({
//                         xalign: 0,
//                         truncate: 'end',
//                         maxWidthChars: 10, // Doesn't matter, just needs to be non negative
//                         className: 'txt txt-smallie',
//                         setup: (self) => self.hook(Hyprland.active.client, label => { // Hyprland.active.client
//                             label.label = Hyprland.active.client.title.length === 0 ? `Workspace ${Hyprland.active.workspace.id}` : Hyprland.active.client.title;
//                         }),
//                     })
//                 ]
//             })
//         });
//     } catch {
//         return null;
//     }
// }

//const OptionalWindowTitleInstance = await WindowTitle();

export default () => Widget.EventBox({
    onScrollUp: () => {
        Indicator.popup(1); // Since the brightness and speaker are both on the same window
        Brightness.screen_value += 0.05;
    },
    onScrollDown: () => {
        Indicator.popup(1); // Since the brightness and speaker are both on the same window
        Brightness.screen_value -= 0.05;
    },
    onPrimaryClick: () => {
        App.toggleWindow('sideleft');
    },
    child: Widget.Box({
        homogeneous: false,
        children: [
            Widget.Box({ className: 'bar-corner-spacing' }),
            Widget.Overlay({
                overlays: [
                    Widget.Box({ hexpand: true }),
                    Widget.Box({
                        children:  [
                               // OptionalWindowTitleInstance,
                               SystemResourcesOrCustomModule(),
                            ]
                    }),
                ]
            })
        ]
    })
});