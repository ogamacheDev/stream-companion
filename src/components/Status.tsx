const Status = ({ state = false }: { state?: boolean }) => {
    return (
        <div className="w-5 h-5 rounded-full transition-colors" style={{ background: state ? "#14A800" : "#FB0000" }}></div>
    )
}

export { Status }