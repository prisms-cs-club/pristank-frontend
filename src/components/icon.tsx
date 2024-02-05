import Image from "next/image";

const uiIconPath = new Map<string, string>([
    ["hp", "/resource/ui/hp.svg"],
    ["money", "/resource/ui/money.svg"],
    ["speed", "/resource/ui/speed.svg"],
    ["visionRadius", "/resource/ui/vision-radius.svg"]
]);

export default function PropIcon(props: { name: string }) {
    return (
    (uiIconPath.get(props.name))
        ? <Image style={{display: "inline"}} src={uiIconPath.get(props.name)!} alt={props.name} width={24} height={24} />
        : <span>{props.name}:</span>
    )
}