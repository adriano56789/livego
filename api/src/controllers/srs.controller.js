const User = require('../models/User');
const Stream = require('../models/Stream');

// @desc    Callback para quando um cliente se conecta ao SRS
// @route   POST /api/srs/on_connect
// @access  Private (SRS)
exports.onConnect = async (req, res) => {
  try {
    const { ip, app, tcUrl } = req.body;
    
    // Registrar a conexão (opcional)
    console.log(`Cliente conectado: ${ip} - ${app} - ${tcUrl}`);
    
    // Retornar sucesso para o SRS
    res.json({
      code: 0,
      msg: 'Conexão autorizada',
    });
  } catch (error) {
    console.error('Erro no callback on_connect:', error);
    res.status(500).json({
      code: 500,
      msg: 'Erro interno do servidor',
    });
  }
};

// @desc    Callback para quando um stream é publicado
// @route   POST /api/srs/on_publish
// @access  Private (SRS)
exports.onPublish = async (req, res) => {
  try {
    const { stream, app, name: streamKey } = req.body;
    
    console.log(`Stream publicado: ${stream} - ${app} - ${streamKey}`);
    
    // Verificar se a chave de stream pertence a um usuário
    const user = await User.findOne({ stream_key: streamKey });
    
    if (!user) {
      return res.status(403).json({
        code: 1,
        msg: 'Stream key inválida',
      });
    }
    
    // Criar ou atualizar o registro do stream
    let streamDoc = await Stream.findOne({ stream_key: streamKey });
    
    if (!streamDoc) {
      streamDoc = new Stream({
        user: user._id,
        stream_key: streamKey,
        title: `Stream de ${user.username}`,
        is_live: true,
        srs_stream_id: stream,
        started_at: new Date(),
      });
    } else {
      streamDoc.is_live = true;
      streamDoc.srs_stream_id = stream;
      streamDoc.started_at = new Date();
    }
    
    await streamDoc.save();
    
    // Atualizar o status do usuário para "ao vivo"
    user.is_live = true;
    user.current_stream = streamDoc._id;
    await user.save();
    
    res.json({
      code: 0,
      msg: 'Stream autorizado',
    });
  } catch (error) {
    console.error('Erro no callback on_publish:', error);
    res.status(500).json({
      code: 500,
      msg: 'Erro interno do servidor',
    });
  }
};

// @desc    Callback para quando um stream é interrompido
// @route   POST /api/srs/on_unpublish
// @access  Private (SRS)
exports.onUnpublish = async (req, res) => {
  try {
    const { stream, app, name: streamKey } = req.body;
    
    console.log(`Stream interrompido: ${stream} - ${app} - ${streamKey}`);
    
    // Atualizar o status do stream para offline
    await Stream.updateOne(
      { stream_key: streamKey },
      { 
        $set: { 
          is_live: false,
          ended_at: new Date() 
        } 
      }
    );
    
    // Atualizar o status do usuário
    await User.updateOne(
      { stream_key: streamKey },
      { 
        $set: { 
          is_live: false,
          current_stream: null
        } 
      }
    );
    
    res.json({
      code: 0,
      msg: 'Stream interrompido com sucesso',
    });
  } catch (error) {
    console.error('Erro no callback on_unpublish:', error);
    res.status(500).json({
      code: 500,
      msg: 'Erro interno do servidor',
    });
  }
};

// @desc    Callback para quando um cliente desconecta
// @route   POST /api/srs/on_stop
// @access  Private (SRS)
exports.onStop = async (req, res) => {
  // Este callback é semelhante ao on_unpublish, mas é chamado quando o cliente desconecta
  // Podemos simplesmente retornar sucesso, pois o on_unpublish já lida com a lógica
  res.json({
    code: 0,
    msg: 'Conexão encerrada',
  });
};
