import { circuits } from "./circuits/circuits";
import { circuit } from "./globalCircuits";
import { TutorialData } from "./types";

export const tutorialData: TutorialData[] = [
    {
        title: '',
        text: ''
    },
    {
        title: 'This is a mosfet.',
        text: `<p>
            The end closest to GROUND is the Source. <br>
            The end closest to VDD is the Drain. <br>
            The middle terminal is the Gate.
        </p>`,
        location: {
            x: 'left: 50px;',
            y: 'bottom: 50px;'
        },
        reaction: () => {
            circuit.value = circuits['nMosSingle']
        }
    },
    {
        title: 'Click on the mosfet to see the IV Characteristics.',
        text: `<p>
            Two factors influence the current through the mosfet: <br>
            <li>The Gate to Source voltage (Vgs), and </li>
            <li>The Drain to source voltage (Vgs) </li>
        </p>`,
        location: {
            x: 'left: 50px;',
            y: 'bottom: 50px;'
        },
        reaction: () => {
            circuit.value.devices.mosfets["M1"].selected.value = true
        }
    },
    {
        title: 'Adjust the voltages and see what happens.',
        text: `<p>
            <li>Vgs has a huge impact on the current.</li>
            <li>Vds doesn't matter beyond the first 200mV or so.</li>
            <li>If either Vds or Vgs is zero, no current flows.</li>
        </p>`,
        location: {
            x: 'left: 50px;',
            y: 'bottom: 50px;'
        },
    },
    {
        title: 'This is a voltage source.',
        text: `<p>
        This voltage source controls the Vds of the mosfet. <br>
        <li>When Vds gets close to zero, the current through the mosfet is reduced dramatically.</li>
        <li>When Vds is near zero, we say the mosfet is no longer saturated, or "in the ohmic region".</li>
        <li>In this simulator, the color of the mosfet's drain will change when it is in the ohmic region.</li>
        </p>`,
        location: {
            x: 'left: 50px;',
            y: 'top: 50px;'
        },
    },
    {
        title: 'Take your time',
        text: `<p>
            Play around with this circuit some more. <br>
            Get really familiar with it.<br>
            Then there's more to explore.
        </p>`,
        location: {
            x: 'left: 200px;',
            y: 'top: 50px;'
        },
    },
]
