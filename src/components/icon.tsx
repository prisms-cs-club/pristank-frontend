import Image from "next/image";
import { useContext } from "react";
import hpSvg from "../images/ui/hp.svg";
import moneySvg from "../images/ui/money.svg";
import speedSvg from "../images/ui/speed.svg";
import visionRadiusSvg from "../images/ui/vision-radius.svg";

const uiIconPath = new Map<string, string>([
    ["hp", hpSvg],
    ["money", moneySvg],
    ["speed", speedSvg],
    ["visionRadius", visionRadiusSvg]
]);

export default function PropIcon(props: { name: string }) {
    return (
    (uiIconPath.get(props.name))
        ? <Image style={{display: "inline"}} src={uiIconPath.get(props.name)!} alt={props.name} width={24} height={24} />
        : <span>{props.name}:</span>
    )
}