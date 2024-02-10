import Image from "next/image";

const uiIconPath = new Map<string, string>([
    // player property icons
    ["hp", "/resource/ui/hp.svg"],
    ["money", "/resource/ui/money.svg"],
    ["speed", "/resource/ui/speed.svg"],
    ["visionRadius", "/resource/ui/vision-radius.svg"],

    // playback controller icons
    ["play", "/resource/control/play.svg"],
    ["pause", "/resource/control/pause.svg"],
    ["speed-up", "/resource/control/speed-up.svg"],
    ["speed-down", "/resource/control/speed-down.svg"],
]);

export default function PropIcon(props: { name: string }) {
    return (
    (uiIconPath.get(props.name))
        ? <Image style={{display: "inline"}} src={uiIconPath.get(props.name)!} alt={props.name} width={24} height={24} />
        : <span>{props.name}:</span>
    )
}