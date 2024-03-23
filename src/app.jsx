import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const fetchUser = username => fetch(`https://api.github.com/users/${username}`)
  .then(res => res.json())
  .then(data => ({ id: data.id, name: data.name, avatarUrl: data.avatar_url }))

const UserPicker = ({ onChangeUser }) => usernames.map((_, i) =>
  <button key={usernames[i]} onClick={() => onChangeUser(i)}>Usuário {`${i + 1}`}</button>)

const usernames = ['Roger-Melo', 'ryanflorence', 'getify', 'gaearon']

const User = () => {
  const [username, setUsername] = useState(usernames[0])
  const { isLoading, isError, isSuccess, error, data } = useQuery({
    queryKey: ['user', username],
    queryFn: () => fetchUser(username),
    refetchOnWindowFocus: false
  })

  const changeUser = i => setUsername(usernames[i])
  const userIndex = usernames.indexOf(username)

  return (
    <>
      <UserPicker onChangeUser={changeUser} />
      {isLoading && <p>Carregando informações...</p>}
      {isError && <p>{error.message}</p>}
      {isSuccess && (
        <>
          <h1>Usuário {userIndex + 1}: {data.name}</h1>
          <img src={data.avatarUrl} alt={`Foto de ${data.name}`} className="avatar" />
        </>
      )}
    </>
  )
}

const App = () => <User />

export { App }
