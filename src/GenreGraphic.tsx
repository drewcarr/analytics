import React from 'react'

interface songGenreItem {
    songId: string,
    genres: string[],
}

interface GenreGraphicProps {
    getSongGenres(): songGenreItem[];
}

interface GenreGraphicState {

}

export default class GenreGaphic extends React.Component<GenreGraphicProps, GenreGraphicState>  {
    render () {
        return (
            <h1>Graphic</h1>
        )
    }
}