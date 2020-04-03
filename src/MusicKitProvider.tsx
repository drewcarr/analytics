import React, { useState, useEffect } from 'react'
import { loadSongs, getISRCfromAppleIds } from './AppleMusicApi'
// import { useMusicManager } from './MusicManager'

function useMusicManager () {
    const [musicState, setMusicState] = useState("Not Set")

    useEffect (() => {
        function handleStatusChange (status: any) {
            console.log("Handled status change");
            setMusicState(status.state)
        }
    });
    
    return [musicState, setMusicState];
}

const [musicState, setMusicState] = useMusicManager();

setMusicState('Apple');

const jwt = require('jsonwebtoken');

interface MusicKitProviderProps {
    children: React.ReactNode;
}

interface UserInfo {
    songs: MusicKit.MediaItem[]
}

interface MusicKitProviderState {
    ready: boolean,
    musicInstance: MusicKit.MusicKitInstance,
    isAuth: boolean,
    userInfo: UserInfo,
}

interface songGenreItem {
    songId: string,
    genres: string[],
}

export default class MusicKitProvider extends React.Component<MusicKitProviderProps, MusicKitProviderState> {
    
    constructor(props: MusicKitProviderProps) {
        super(props);
        this.state = {
            ready: false,
            musicInstance: {} as MusicKit.MusicKitInstance,
            isAuth: false,
            userInfo: {
                songs: []
            },
        };
    }

    public componentDidMount = () => {
        const script = document.createElement("script");

        script.src = "https://js-cdn.music.apple.com/musickit/v1/musickit.js";
        script.async = true;

        document.body.appendChild(script);

        document.addEventListener('musickitloaded', this.configureMusicKit);
        // TODO: Maybe mmake a loading thingy
    }

    private configureMusicKit = () => {
        console.log(process.env);
        if (!process.env.REACT_APP_APPLE_SECRET) {
            console.log("REACT_APP_APPLE_SECRET is undefined");
            return;
        }
        const jwtToken = jwt.sign({}, process.env.REACT_APP_APPLE_SECRET, {
            algorithm: "ES256",
            expiresIn: "180d",
            issuer: "U7B85D5EVP",
            header: {
                alg: "ES256",
                kid: "8258F74RG2"
            }
        })

        MusicKit.configure({
            developerToken: jwtToken,
            app: {
                name: 'MusicSuite',
                build: '2.0.0',
                version: '2.0.0',
            },
            bitrate: MusicKit.PlaybackBitrate.HIGH,
        });
        const music: MusicKit.MusicKitInstance = MusicKit.getInstance();
        console.log(MusicKit);
        console.log(music);

        // TODO: have a cookie hold whether to auto sign in
        // Have a cookie to "remember me"

        const handler = this.handleAuthChange as () => void;
        MusicKit.getInstance().addEventListener(MusicKit.Events.authorizationStatusDidChange, handler);

        this.setState({
            ready: true,
            musicInstance: music,
            isAuth: music.isAuthorized,
        });
    }

    private handleAuthChange = ({ authorizationStatus }: { authorizationStatus: number }) => {      
        if (authorizationStatus === 0) {
            this.setState({
                isAuth: false,
            });
        } else {
            setImmediate(() => {
                this.setState({
                    isAuth: true,
                });
            });
        }
    }

    private login = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (this.state.isAuth)
            return;
        this.state.musicInstance.authorize();
    }

    private logout = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (!this.state.isAuth)
            return;
        this.state.musicInstance.unauthorize();
    }

    private getAuthButton = () => {
        if (!this.state.isAuth)
            return <button onClick={this.login}>Login</button>
        else
            return <button onClick={this.logout}>Logout</button>
    }

    private getUserSongs = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        console.log(this.state.musicInstance.api.library);
        let page: number = 0;
        let offset: number = 100;
        let stop: boolean = false;
        const batch: number = 5;
        while (!stop) {
            let promises: Promise<MusicKit.MediaItem[]>[] = [];
            for (let i: number = 0; i < batch; i++) {
                promises[i] = loadSongs({
                    limit: offset,
                    offset: page * offset,
                });
                page++;
            }
            try {
                await Promise.all(promises).then(newItems => {
                    console.log("Got items with offset ", page, newItems);
                    newItems.forEach(items => {
                        if (!items.length)
                            stop = true;
                        // this.getISRCSfromAppleMediaItems(items);
                        this.setState(state => {
                            const newSongs = state.userInfo.songs.concat(items);

                            return {
                                userInfo: { songs: newSongs }
                            }
                        })

                    });

                });
            } catch (e) {
                // TODO: be able to call that one again
                console.log("Got error while retrieving songs ", e);
                break;
            }
            console.log("looping with page = ", page);
        }
        console.log("Finished getting songs", this.state.userInfo.songs);
    }

    private getISRCSfromAppleMediaItems = async (items: MusicKit.MediaItem[]) => {
        let appleIds: string[] = [];
        items.forEach(item => {
            if (item.attributes.playParams) {
                appleIds.push(item.attributes.playParams.catalogId);
            } else {
                // TODO: handle this by searching for song
            }
        });
        await getISRCfromAppleIds(appleIds).then(response => {
            console.log(response);
        })
    }

    public getSongGenreMap = () => {
        let map: songGenreItem[] = [];
        this.state.userInfo.songs.forEach(song => {
            map.push({
                songId: song.id,
                genres: song.attributes.genreNames
            })
        });
        return map;
    }

    render() {
        return (
            <div id="appleControl">
                <h1>Apple</h1>
                {this.state.ready && this.getAuthButton()}
                {!this.state.ready && <p>Loading MusicKit</p>}
                <button onClick={this.getUserSongs}>Get Songs</button>
            </div>
        )
    }
}