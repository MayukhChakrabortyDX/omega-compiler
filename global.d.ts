declare function state(): (target: any) => void
declare function vector(): (target: any) => void
declare function Container(target: any): any
declare function component(props: { template: string, children?: { [key: string]: new (...args: any) => Model } }): ( target: any ) => void
declare class Model {
    render(): DocumentFragment
}
declare function init(): <T extends Model>(target:() => T) => void