'use client';

import { useEffect, useState } from "react";
import styles from "@/app/page.module.css";
import { MapEditor, loadMapEditor } from "@/map-editor";
import LoadingScene from "@/components/loading-scene";
import MapEditorScene from "@/components/map-editor-scene";

export default function Page() {
    const [mapEditor, setMapEditor] = useState<MapEditor>();
    const [tasker, _] = useState(loadMapEditor);
    return (
        <main>
            { mapEditor
                ? <MapEditorScene mapEditor={mapEditor}></MapEditorScene>
                : <LoadingScene tasker={tasker} allComplete={setMapEditor}></LoadingScene>
            }
        </main>
    )
}