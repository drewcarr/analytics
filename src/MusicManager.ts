import React, { useState, useEffect } from 'react'

function useMusicManager () {
    const [musicState, setMusicState] = useState({ type: null, songs: [] })

    useEffect (() => {
        function handleStatusChange (status: any) {
            console.log("Handled status change");
            setMusicState(status.state)
        }
    });
    
    return [musicState, setMusicState];
}

export default { useMusicManager }